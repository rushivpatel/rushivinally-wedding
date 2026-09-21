"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { WeddingEvent } from "@/data/weddingDetails";

type Status = "attending" | "not_attending" | "undecided" | null;

type SummaryGuest = {
  guestId: string;
  householdId: string | null;
  fullName: string;
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
 *  a key only for events the person is invited to (null = not answered yet). */
type Person = {
  key: string;
  name: string;
  isSlot: boolean;
  isChild: boolean;
  inMemoriam: boolean;
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

function StatCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="liquid-glass-lite rounded-2xl px-4 py-3">
      <p className="font-primary text-3xl text-primary">{value}</p>
      <p className="text-[11px] uppercase tracking-widest text-primary/70">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-primary/50">{sub}</p>}
    </div>
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

  const eventSlugs = useMemo(() => weddingEvents.map((e) => e.eventid), [weddingEvents]);

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

  const allPeople = useMemo(() => groups.flatMap((g) => g.people), [groups]);

  const sides = useMemo(
    () => [...new Set(groups.map((g) => g.side).filter((s): s is string => Boolean(s)))].sort(),
    [groups]
  );

  // Children and in-memoriam guests stay in the guest list below but count as
  // zero everywhere. (The master login itself is never sent by the API.)
  const countedPeople = useMemo(
    () => allPeople.filter((p) => !p.isChild && !p.inMemoriam),
    [allPeople]
  );

  const stats = useMemo(() => {
    const perEvent = eventSlugs.map((slug) => {
      const counts = { invited: 0, attending: 0, not_attending: 0, undecided: 0, pending: 0 };
      for (const person of countedPeople) {
        if (!(slug in person.answers)) continue;
        counts.invited++;
        const status = person.answers[slug];
        if (status === null) counts.pending++;
        else counts[status]++;
      }
      const unnamed = groups.reduce(
        (sum, g) => (g.host?.eventSlugs.includes(slug) ? sum + g.host.unnamed : sum),
        0
      );
      return { slug, ...counts, unnamed };
    });

    const progressCounts = { "not-started": 0, partial: 0, complete: 0 };
    for (const person of countedPeople) {
      if (Object.keys(person.answers).length > 0) progressCounts[progress(person)]++;
    }

    const guests = (data?.guests ?? []).filter((g) => !g.isChild && !g.inMemoriam);
    const households = new Set(groups.map((g) => g.key)).size;
    return {
      perEvent,
      progressCounts,
      households,
      people: countedPeople.length,
      unnamedSeats: groups.reduce((sum, g) => sum + (g.host?.unnamed ?? 0), 0),
      digital: guests.filter((g) => g.digitalSent).length,
      physical: guests.filter((g) => g.physicalSent).length,
      invite: guests.filter((g) => g.inviteSent).length,
      guestTotal: guests.length,
    };
  }, [countedPeople, groups, data, eventSlugs]);

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return groups.filter((group) => {
      if (side !== "all" && group.side !== side) return false;
      if (needle && !group.search.includes(needle)) return false;
      if (filter === "all") return true;
      if (group.people.some((p) => personMatches(p, filter))) return true;
      // An open invite with no seats named yet has nobody to match against —
      // count it as "not started".
      return filter === "not-started" && group.host !== null && group.people.length === 0;
    });
  }, [groups, search, filter, side]);

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

  const nameOf = (slug: string) => weddingEvents.find((e) => e.eventid === slug)?.name ?? slug;

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

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={stats.people} label="Guests answering" sub={`${stats.households} households`} />
        <StatCard
          value={stats.progressCounts.complete}
          label="Fully answered"
          sub={`${Math.round((stats.progressCounts.complete / Math.max(stats.people, 1)) * 100)}% of guests`}
        />
        <StatCard value={stats.progressCounts.partial} label="Partly answered" />
        <StatCard value={stats.progressCounts["not-started"]} label="Not started" />
      </div>

      {/* Per event */}
      <section>
        <SectionTitle>By event</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-primary/15 text-left text-[11px] uppercase tracking-widest text-primary/60">
                <th className="py-2 pr-3 font-normal">Event</th>
                <th className="px-2 text-center font-normal">Invited</th>
                <th className="px-2 text-center font-normal">Attending</th>
                <th className="px-2 text-center font-normal">Not</th>
                <th className="px-2 text-center font-normal">Maybe</th>
                <th className="px-2 text-center font-normal">Pending</th>
                <th className="px-2 text-center font-normal" title="Seats on open invites nobody has named yet">
                  Unnamed seats
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.perEvent.map((row) => (
                <tr key={row.slug} className="border-b border-primary/10">
                  <td className="py-2 pr-3">{nameOf(row.slug)}</td>
                  <td className="px-2 text-center">{row.invited}</td>
                  <td className="px-2 text-center font-bold">
                    {row.attending}
                  </td>
                  <td className="px-2 text-center text-primary/60">{row.not_attending}</td>
                  <td className="px-2 text-center text-quinary">{row.undecided}</td>
                  <td className="px-2 text-center text-primary/50">{row.pending}</td>
                  <td className="px-2 text-center text-primary/50">{row.unnamed || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mailing tracker */}
      <section>
        <SectionTitle>Mailings</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={`${stats.digital}/${stats.guestTotal}`} label="Digital save-the-date" />
          <StatCard value={`${stats.physical}/${stats.guestTotal}`} label="Physical save-the-date" />
          <StatCard value={`${stats.invite}/${stats.guestTotal}`} label="Invite sent" />
        </div>
      </section>

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
              onChange={(e) => setSide(e.target.value)}
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
          <p className="text-xs text-primary/50">
            ✓ attending · ✗ not attending · ? undecided · … no response · blank = not invited
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-primary/15 align-bottom text-[10px] uppercase leading-tight tracking-wider text-primary/60">
                <th className="py-2 pr-3 text-left font-normal">Guest</th>
                {weddingEvents.map((event) => (
                  <th key={event.eventid} className="w-16 px-1 text-center font-normal" title={event.name}>
                    {event.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <Fragment key={group.key}>
                  {group.host && (
                    <tr className="border-t border-primary/10">
                      <td className="py-1.5 pr-3" colSpan={eventSlugs.length + 1}>
                        <span className="font-bold">{group.host.name}</span>
                        <span className="ml-2 text-xs text-primary/50">
                          open invite · {group.host.seats - group.host.unnamed} of {group.host.seats} seats named
                          {group.relation ? ` · ${group.relation}` : ""}
                        </span>
                      </td>
                    </tr>
                  )}
                  {group.people.map((person, index) => (
                    <tr
                      key={person.key}
                      className={
                        index === 0 && !group.host ? "border-t border-primary/10" : ""
                      }
                    >
                      <td
                        className={`py-1.5 pr-3 ${person.isSlot ? "pl-4" : ""} ${
                          person.inMemoriam ? "text-primary/40" : ""
                        }`}
                      >
                        {person.isSlot && <span className="mr-1 text-primary/30">↳</span>}
                        {person.name}
                        {person.isChild && <span className="ml-1 text-[10px] text-primary/50">(child)</span>}
                        {person.inMemoriam && (
                          <span className="ml-1 text-[10px] text-primary/40">(in memoriam)</span>
                        )}
                        {!person.isSlot && index === 0 && (group.relation || group.side) && (
                          <span className="ml-2 text-[11px] text-primary/40">
                            {[group.side, group.relation].filter(Boolean).join(" · ")}
                          </span>
                        )}
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
                  ))}
                  {group.host && group.host.unnamed > 0 && (
                    <tr>
                      <td className="py-1 pl-4 pr-3 text-xs italic text-primary/40" colSpan={eventSlugs.length + 1}>
                        ↳ {group.host.unnamed} seat{group.host.unnamed === 1 ? "" : "s"} not named yet
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filteredGroups.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-primary/50" colSpan={eventSlugs.length + 1}>
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
