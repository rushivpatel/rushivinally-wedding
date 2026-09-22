"use client";

import { useEffect, useMemo, useState } from "react";
import type { WeddingEvent } from "@/data/weddingDetails";

type Status = "attending" | "not_attending" | "undecided" | null;

type SummaryGuest = {
  guestId: string;
  householdId: string | null;
  fullName: string;
  email: string | null;
  side: string | null;
  relationLabel: string | null;
  isChild: boolean;
  inMemoriam: boolean;
  dietary: string | null;
  message: string | null;
  openSlots: number | null;
  digitalSent: boolean;
  physicalSent: boolean;
  inviteSent: boolean;
};

type SummaryData = {
  guests: SummaryGuest[];
  invites: { guestId: string; eventSlug: string; status: Status }[];
  slots: { slotId: string; guestId: string; slotNumber: number; fullName: string }[];
  slotInvites: { slotId: string; eventSlug: string; status: Status }[];
};

/** One answering person: a guest, or a named open-invite slot. `answers` has
 *  a key only for events the person is invited to (null = not answered yet).
 *  Mailing fields are null for slots — they aren't guest records of their own. */
type Person = {
  key: string;
  name: string;
  isSlot: boolean;
  isChild: boolean;
  inMemoriam: boolean;
  email: string | null;
  digitalSent: boolean | null;
  physicalSent: boolean | null;
  inviteSent: boolean | null;
  answers: Record<string, Status>;
};

type Group = {
  key: string;
  label: string;
  side: string | null;
  relation: string | null;
  /** For open-invite hosts: the login row and how many seats are still unnamed. */
  host: { name: string; seats: number; unnamed: number; eventSlugs: string[] } | null;
  people: Person[];
  search: string;
};

type Filter = "all" | "not-started" | "partial" | "complete" | "attending" | "declined";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Everyone",
  "not-started": "Not started",
  partial: "Partly answered",
  complete: "Fully answered",
  attending: "Attending something",
  declined: "Declined everything",
};

function progress(person: Person): "not-started" | "partial" | "complete" {
  const values = Object.values(person.answers);
  const answered = values.filter((v) => v !== null).length;
  if (answered === 0) return "not-started";
  return answered === values.length ? "complete" : "partial";
}

function personMatches(person: Person, filter: Filter): boolean {
  if (filter === "all") return true;
  if (person.inMemoriam) return false;
  const values = Object.values(person.answers);
  if (filter === "attending") return values.includes("attending");
  if (filter === "declined") return values.length > 0 && values.every((v) => v === "not_attending");
  return progress(person) === filter;
}

const CELL: Record<string, { glyph: string; className: string; title: string }> = {
  attending: { glyph: "✓", className: "font-bold text-primary", title: "Attending" },
  not_attending: { glyph: "✗", className: "text-primary/40", title: "Not attending" },
  undecided: { glyph: "?", className: "font-bold text-quinary", title: "Undecided" },
  pending: { glyph: "…", className: "text-primary/30", title: "Invited — no response yet" },
};

/** Small yes/no indicator for the mailing columns. null = not applicable
 *  (an open-invite seat, which has no guest record of its own to mail). */
function BoolCell({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-primary/20">–</span>;
  return value ? (
    <span className="font-bold text-primary">✓</span>
  ) : (
    <span className="text-primary/25">—</span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-primary text-xl text-quinary">{children}</h2>;
}

export default function MasterSummary({
  guestId,
  weddingEvents,
}: {
  guestId: string;
  weddingEvents: WeddingEvent[];
}) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [side, setSide] = useState("all");
  const [relation, setRelation] = useState("all");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rsvp/summary?guestId=${guestId}`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guestId, reloadKey]);

  function load() {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  function handleSideChange(value: string) {
    setSide(value);
    // The relation options depend on the selected side, so a stale pick
    // from the other side would otherwise silently filter out everyone.
    setRelation("all");
  }

  const eventSlugs = useMemo(() => weddingEvents.map((e) => e.eventid), [weddingEvents]);
  const columnCount = eventSlugs.length + 7; // Side, Relation, Guest, Email, Digital, Physical, Invite

  const groups: Group[] = useMemo(() => {
    if (!data) return [];

    const inviteAnswers = (id: string) => {
      const answers: Record<string, Status> = {};
      for (const invite of data.invites) {
        if (invite.guestId === id) answers[invite.eventSlug] = invite.status;
      }
      return answers;
    };

    const byHousehold = new Map<string, SummaryGuest[]>();
    for (const guest of data.guests) {
      const key = guest.householdId ?? `solo-${guest.guestId}`;
      byHousehold.set(key, [...(byHousehold.get(key) ?? []), guest]);
    }

    const result: Group[] = [];
    for (const [key, members] of byHousehold) {
      const people: Person[] = [];
      let host: Group["host"] = null;

      for (const guest of members) {
        const answers = inviteAnswers(guest.guestId);
        if (guest.openSlots) {
          // Open-invite login: not an invitee, only their named seats answer.
          const named = data.slots
            .filter((s) => s.guestId === guest.guestId)
            .sort((a, b) => a.slotNumber - b.slotNumber);
          const hostSlugs = Object.keys(answers);
          host = {
            name: guest.fullName,
            seats: guest.openSlots,
            unnamed: guest.openSlots - named.length,
            eventSlugs: hostSlugs,
          };
          for (const slot of named) {
            const slotAnswers: Record<string, Status> = {};
            for (const slug of hostSlugs) {
              slotAnswers[slug] =
                data.slotInvites.find((i) => i.slotId === slot.slotId && i.eventSlug === slug)
                  ?.status ?? null;
            }
            people.push({
              key: `slot-${slot.slotId}`,
              name: slot.fullName,
              isSlot: true,
              isChild: false,
              inMemoriam: false,
              email: null,
              digitalSent: null,
              physicalSent: null,
              inviteSent: null,
              answers: slotAnswers,
            });
          }
        } else {
          people.push({
            key: guest.guestId,
            name: guest.fullName,
            isSlot: false,
            isChild: guest.isChild,
            inMemoriam: guest.inMemoriam,
            email: guest.email,
            digitalSent: guest.digitalSent,
            physicalSent: guest.physicalSent,
            inviteSent: guest.inviteSent,
            // In-memoriam guests have no responses to track.
            answers: guest.inMemoriam ? {} : answers,
          });
        }
      }

      const first = members[0];
      result.push({
        key,
        label: host ? `${host.name} (open invite)` : members.map((m) => m.fullName).join(" & "),
        side: first.side,
        relation: first.relationLabel,
        host,
        people,
        search: [...members.map((m) => m.fullName), ...people.map((p) => p.name)]
          .join(" ")
          .toLowerCase(),
      });
    }

    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const sides = useMemo(
    () => [...new Set(groups.map((g) => g.side).filter((s): s is string => Boolean(s)))].sort(),
    [groups]
  );

  const relations = useMemo(() => {
    if (side === "all") return [];
    return [
      ...new Set(
        groups
          .filter((g) => g.side === side)
          .map((g) => g.relation)
          .filter((r): r is string => Boolean(r))
      ),
    ].sort();
  }, [groups, side]);

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return groups.filter((group) => {
      if (side !== "all" && group.side !== side) return false;
      if (side !== "all" && relation !== "all" && group.relation !== relation) return false;
      if (needle && !group.search.includes(needle)) return false;
      if (filter === "all") return true;
      if (group.people.some((p) => personMatches(p, filter))) return true;
      // An open invite with no seats named yet has nobody to match against —
      // count it as "not started".
      return filter === "not-started" && group.host !== null && group.people.length === 0;
    });
  }, [groups, search, filter, side, relation]);

  // Rows, flattened and nested-clustered: side first (Vinally's side, then
  // Rushi's, per the fixed order below), then relation_label within each
  // side. Each level's label is shown once per contiguous block via a
  // single row-spanning cell rather than repeated on every row.
  const { rows, sideStarts, relationStarts } = useMemo(() => {
    const SIDE_ORDER: Record<string, number> = { vinally: 0, rushi: 1 };
    const sideRank = (key: string) => (key ? SIDE_ORDER[key.toLowerCase()] ?? 2 : 3);
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const bySide = new Map<string, Group[]>();
    const sideOrder: string[] = [];
    for (const group of filteredGroups) {
      const key = group.side ?? "";
      if (!bySide.has(key)) {
        bySide.set(key, []);
        sideOrder.push(key);
      }
      bySide.get(key)!.push(group);
    }
    sideOrder.sort((a, b) => {
      const ra = sideRank(a);
      const rb = sideRank(b);
      return ra !== rb ? ra - rb : a.localeCompare(b);
    });

    type Row =
      | { type: "host"; group: Group }
      | { type: "person"; group: Group; person: Person; personIndex: number }
      | { type: "unnamed"; group: Group };

    const flat: Row[] = [];
    const sStarts = new Map<number, { label: string; rowSpan: number }>();
    const rStarts = new Map<number, { label: string; rowSpan: number }>();

    for (const sideKey of sideOrder) {
      const sideStartIndex = flat.length;

      // Cluster this side's households by relation, same pattern as side.
      const byRelation = new Map<string, Group[]>();
      const relationOrder: string[] = [];
      for (const group of bySide.get(sideKey)!) {
        const key = group.relation ?? "";
        if (!byRelation.has(key)) {
          byRelation.set(key, []);
          relationOrder.push(key);
        }
        byRelation.get(key)!.push(group);
      }
      relationOrder.sort((a, b) => {
        if (!a && b) return 1;
        if (a && !b) return -1;
        return a.localeCompare(b);
      });

      for (const relationKey of relationOrder) {
        const relationStartIndex = flat.length;
        for (const group of byRelation.get(relationKey)!) {
          if (group.host) flat.push({ type: "host", group });
          group.people.forEach((person, personIndex) =>
            flat.push({ type: "person", group, person, personIndex })
          );
          if (group.host && group.host.unnamed > 0) flat.push({ type: "unnamed", group });
        }
        const relationRowSpan = flat.length - relationStartIndex;
        if (relationRowSpan > 0) {
          rStarts.set(relationStartIndex, {
            label: relationKey || "No relation listed",
            rowSpan: relationRowSpan,
          });
        }
      }

      const sideRowSpan = flat.length - sideStartIndex;
      if (sideRowSpan > 0) {
        sStarts.set(sideStartIndex, {
          label: sideKey ? capitalize(sideKey) : "No side listed",
          rowSpan: sideRowSpan,
        });
      }
    }

    return { rows: flat, sideStarts: sStarts, relationStarts: rStarts };
  }, [filteredGroups]);

  const messages = (data?.guests ?? []).filter((g) => g.message && g.message.trim());
  const dietary = (data?.guests ?? []).filter((g) => g.dietary && g.dietary.trim());

  if (loading && !data) {
    return <p className="font-secondary text-primary/60">Loading summary...</p>;
  }
  if (error || !data) {
    return (
      <p className="font-secondary text-primary/60">
        Couldn&apos;t load the summary.{" "}
        <button type="button" onClick={load} className="underline">
          Try again
        </button>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-12 font-secondary text-primary">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-primary/70">Master summary — every guest, live from the database.</p>
        <button
          type="button"
          onClick={load}
          className="liquid-glass-lite rounded-full px-5 py-2 text-sm font-bold transition-shadow active:scale-95"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Guest matrix */}
      <section>
        <SectionTitle>Every guest</SectionTitle>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name…"
            autoComplete="off"
            className="h-9 w-44 rounded-full border border-primary/30 bg-transparent px-4 text-base text-primary placeholder:text-primary/40 focus:border-quinary focus:outline-none sm:text-sm"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="h-9 rounded-full border border-primary/30 bg-transparent px-3 text-base text-primary focus:border-quinary focus:outline-none sm:text-sm"
          >
            {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
              <option key={key} value={key}>
                {FILTER_LABELS[key]}
              </option>
            ))}
          </select>
          {sides.length > 0 && (
            <select
              value={side}
              onChange={(e) => handleSideChange(e.target.value)}
              className="h-9 rounded-full border border-primary/30 bg-transparent px-3 text-base text-primary focus:border-quinary focus:outline-none sm:text-sm"
            >
              <option value="all">Both sides</option>
              {sides.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          {side !== "all" && relations.length > 0 && (
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="h-9 rounded-full border border-primary/30 bg-transparent px-3 text-base text-primary focus:border-quinary focus:outline-none sm:text-sm"
            >
              <option value="all">All relations</option>
              {relations.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-primary/50">
            ✓ attending · ✗ not attending · ? undecided · … no response · blank = not invited
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-primary/15 align-bottom text-[10px] uppercase leading-tight tracking-wider text-primary/60">
                <th className="w-16 py-2 pr-3 text-left font-normal">Side</th>
                <th className="w-32 py-2 pr-3 text-left font-normal">Relation</th>
                <th className="whitespace-nowrap w-[1%] py-2 pr-3 text-left font-normal">Guest</th>
                <th className="px-2 text-left font-normal">Email</th>
                <th className="w-14 px-1 text-center font-normal" title="Digital save-the-date sent">
                  Digital
                </th>
                <th className="w-14 px-1 text-center font-normal" title="Physical save-the-date sent">
                  Physical
                </th>
                <th className="w-14 px-1 text-center font-normal" title="Invite sent">
                  Invite
                </th>
                {weddingEvents.map((event) => (
                  <th key={event.eventid} className="w-16 px-1 text-center font-normal" title={event.name}>
                    {event.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const sideStart = sideStarts.get(rowIndex);
                const sideCell = sideStart && (
                  <td
                    rowSpan={sideStart.rowSpan}
                    className="py-1.5 pr-3 align-top text-xs font-bold uppercase tracking-wide text-primary/70"
                  >
                    {sideStart.label}
                  </td>
                );

                const relationStart = relationStarts.get(rowIndex);
                const relationCell = relationStart && (
                  <td
                    rowSpan={relationStart.rowSpan}
                    className="py-1.5 pr-3 align-top text-xs font-bold uppercase tracking-wide text-quinary"
                  >
                    {relationStart.label}
                  </td>
                );

                if (row.type === "host") {
                  return (
                    <tr key={`${row.group.key}-host`} className="border-t border-primary/10">
                      {sideCell}
                      {relationCell}
                      <td className="py-1.5 pr-3" colSpan={columnCount - 2}>
                        <span className="font-bold">{row.group.host!.name}</span>
                        <span className="ml-2 text-xs text-primary/50">
                          open invite · {row.group.host!.seats - row.group.host!.unnamed} of{" "}
                          {row.group.host!.seats} seats named
                        </span>
                      </td>
                    </tr>
                  );
                }

                if (row.type === "unnamed") {
                  return (
                    <tr key={`${row.group.key}-unnamed`}>
                      {sideCell}
                      {relationCell}
                      <td
                        className="py-1 pl-4 pr-3 text-xs italic text-primary/40"
                        colSpan={columnCount - 2}
                      >
                        ↳ {row.group.host!.unnamed} seat{row.group.host!.unnamed === 1 ? "" : "s"} not
                        named yet
                      </td>
                    </tr>
                  );
                }

                const { person, personIndex, group } = row;
                return (
                  <tr
                    key={person.key}
                    className={personIndex === 0 && !group.host ? "border-t border-primary/10" : ""}
                  >
                    {sideCell}
                    {relationCell}
                    <td
                      className={`whitespace-nowrap py-1.5 pr-3 ${person.isSlot ? "pl-4" : ""} ${
                        person.inMemoriam ? "text-primary/40" : ""
                      }`}
                    >
                      {person.isSlot && <span className="mr-1 text-primary/30">↳</span>}
                      {person.name}
                      {person.isChild && <span className="ml-1 text-[10px] text-primary/50">(child)</span>}
                      {person.inMemoriam && (
                        <span className="ml-1 text-[10px] text-primary/40">(in memoriam)</span>
                      )}
                    </td>
                    <td className="truncate px-2 text-xs text-primary/70">{person.email ?? ""}</td>
                    <td className="px-1 text-center">
                      <BoolCell value={person.digitalSent} />
                    </td>
                    <td className="px-1 text-center">
                      <BoolCell value={person.physicalSent} />
                    </td>
                    <td className="px-1 text-center">
                      <BoolCell value={person.inviteSent} />
                    </td>
                    {eventSlugs.map((slug) => {
                      const answer = person.answers[slug];
                      const cell = slug in person.answers ? CELL[answer ?? "pending"] : null;
                      return (
                        <td key={slug} className="px-1 text-center" title={cell?.title}>
                          {cell && <span className={cell.className}>{cell.glyph}</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-primary/50" colSpan={columnCount}>
                    Nobody matches those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Messages */}
      <section>
        <SectionTitle>Messages ({messages.length})</SectionTitle>
        {messages.length === 0 ? (
          <p className="text-sm text-primary/50">No messages yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((guest) => (
              <div key={guest.guestId} className="liquid-glass-lite rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-primary/60">{guest.fullName}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{guest.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dietary */}
      <section>
        <SectionTitle>Dietary restrictions ({dietary.length})</SectionTitle>
        {dietary.length === 0 ? (
          <p className="text-sm text-primary/50">None recorded.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {dietary.map((guest) => (
              <li key={guest.guestId}>
                <span className="font-bold">{guest.fullName}</span>
                <span className="text-primary/70"> — {guest.dietary}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
