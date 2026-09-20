/**
 * Imports guests + their event invites from a CSV (see
 * scripts/guests.template.csv for the expected columns).
 *
 * Safe to re-run: guests are matched by (household, full_name) and
 * updated in place rather than duplicated, and event invites are only
 * ever added, never overwritten — so re-importing a CSV after fixing a
 * typo or adding a few more guests won't reset anyone's RSVP status.
 *
 * Run with:
 *   set -a; source .env.local; set +a
 *   node scripts/import-guests.js scripts/guests.csv
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EVENT_SLUGS = [
  "vinally-grah-shanti",
  "welcome-dinner",
  "rushi-grah-shanti",
  "haldi-pithi",
  "wedding",
  "reception-garba",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toBool(value) {
  return ["yes", "y", "true", "x", "1"].includes((value ?? "").trim().toLowerCase());
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/import-guests.js <path-to-csv>");
    process.exit(1);
  }

  const text = fs.readFileSync(path.resolve(csvPath), "utf8");
  const [header, ...rows] = parseCsv(text);
  const col = Object.fromEntries(header.map((name, i) => [name.trim(), i]));

  for (const required of ["household", "full_name"]) {
    if (!(required in col)) throw new Error(`Missing required column: ${required}`);
  }

  const { data: events, error: eventsError } = await supabase.from("events").select("id, slug");
  if (eventsError) throw eventsError;
  const eventIdBySlug = Object.fromEntries(events.map((e) => [e.slug, e.id]));

  let created = 0;
  let updated = 0;
  let invitesAdded = 0;

  for (const row of rows) {
    const get = (name) => (col[name] !== undefined ? (row[col[name]] ?? "").trim() : "");

    const householdLabel = get("household");
    const fullName = get("full_name");
    if (!householdLabel || !fullName) {
      console.warn("Skipping row missing household or full_name:", row.join(","));
      continue;
    }

    const householdId = slugify(householdLabel);

    const guestPayload = {
      household_id: householdId,
      full_name: fullName,
      email: get("email") || null,
      phone: get("phone") || null,
      address: get("address") || null,
      side: get("side") || null,
      relation_label: get("relation_label") || null,
      is_child: toBool(get("is_child")),
      dietary_restrictions: get("dietary_restrictions") || null,
      simple_invite: toBool(get("simple_invite")),
      hide_rsvp: col["hide_rsvp"] !== undefined ? toBool(get("hide_rsvp")) : true,
      lock_rsvp: toBool(get("lock_rsvp")),
      digital_save_the_date_sent: toBool(get("digital_save_the_date_sent")),
      physical_save_the_date_sent: toBool(get("physical_save_the_date_sent")),
      invite_sent: toBool(get("invite_sent")),
    };

    // Only touched when the CSV actually has the column, so an older CSV
    // without it can't wipe a slot count set directly in Supabase.
    if (col["open_slots"] !== undefined) {
      const raw = get("open_slots");
      if (raw === "") {
        guestPayload.open_slots = null;
      } else if (/^[1-9]\d*$/.test(raw)) {
        guestPayload.open_slots = Number(raw);
      } else {
        throw new Error(`Invalid open_slots "${raw}" for ${fullName} (use a whole number, or leave blank)`);
      }
    }

    const { data: existing, error: lookupError } = await supabase
      .from("guests")
      .select("id")
      .eq("household_id", householdId)
      .eq("full_name", fullName)
      .maybeSingle();
    if (lookupError) throw lookupError;

    let guestId;
    if (existing) {
      guestId = existing.id;
      const { error } = await supabase.from("guests").update(guestPayload).eq("id", guestId);
      if (error) throw error;
      updated++;
    } else {
      const { data: inserted, error } = await supabase
        .from("guests")
        .insert({ ...guestPayload, status: "invited" })
        .select("id")
        .single();
      if (error) throw error;
      guestId = inserted.id;
      created++;
    }

    const inviteRows = EVENT_SLUGS.filter((slug) => toBool(get(slug)) && eventIdBySlug[slug]).map(
      (slug) => ({ guest_id: guestId, event_id: eventIdBySlug[slug] })
    );

    if (inviteRows.length > 0) {
      const { error } = await supabase
        .from("guest_event_invites")
        .upsert(inviteRows, { onConflict: "guest_id,event_id", ignoreDuplicates: true });
      if (error) throw error;
      invitesAdded += inviteRows.length;
    }
  }

  console.log(
    `Done. ${created} guest(s) created, ${updated} guest(s) updated, ${invitesAdded} invite row(s) touched.`
  );
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
