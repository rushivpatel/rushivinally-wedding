"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { WeddingEvent } from "@/data/weddingDetails";
import { formatEventDate } from "@/lib/formatDate";
import { getSvgIconUrl, getSvgFallbackUrl } from "@/lib/loadSvgIcon";
import { getGuestSession, GUEST_SESSION_EVENT, type GuestSession } from "@/lib/guestSession";
import MasterSummary from "./MasterSummary";

/** The household that gets the all-guests summary instead of a personal RSVP. */
const MASTER_HOUSEHOLD = "master";

type InviteStatus = "attending" | "not_attending" | "undecided";

const STATUS_LABELS: Record<InviteStatus, string> = {
  attending: "Attending",
  not_attending: "Not Attending",
  undecided: "Undecided",
};

type HouseholdGuest = {
  guestId: string;
  fullName: string;
  message: string | null;
  dietary: string | null;
  inMemoriam: boolean;
};
type Invite = { guestId: string; eventSlug: string; status: InviteStatus | null };
type Slot = { slotId: string; slotNumber: number; fullName: string };
type SlotInvite = { slotId: string; eventSlug: string; status: InviteStatus };

/** One RSVP line — either a household member or a named open-invite slot. */
type ResponseRow = {
  key: string;
  fullName: string;
  status: InviteStatus | null;
  /** Passed away, still listed out of respect: name only, no response control. */
  inMemoriam?: boolean;
  save: (eventSlug: string, value: InviteStatus) => void | Promise<void>;
};

type RsvpClientProps = {
  weddingEvents: WeddingEvent[];
};

export default function RsvpClient({ weddingEvents }: RsvpClientProps) {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [guests, setGuests] = useState<HouseholdGuest[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [openSlots, setOpenSlots] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotInvites, setSlotInvites] = useState<SlotInvite[]>([]);
  const [slotNames, setSlotNames] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [dietary, setDietary] = useState("");
  const [dietaryStatus, setDietaryStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForSession() {
      const current = getGuestSession();
      setSession(current);
      if (!current || current.hideRsvp || current.householdId === MASTER_HOUSEHOLD) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/rsvp?guestId=${current.guestId}`);
      const data = await response.json();
      const loadedGuests: HouseholdGuest[] = data.guests ?? [];
      setGuests(loadedGuests);
      setInvites(data.invites ?? []);
      const loadedSlots: Slot[] = data.slots ?? [];
      setOpenSlots(data.openSlots ?? null);
      setSlots(loadedSlots);
      setSlotInvites(data.slotInvites ?? []);
      setSlotNames(
        Array.from({ length: data.openSlots ?? 0 }, (_, i) =>
          loadedSlots.find((slot) => slot.slotNumber === i + 1)?.fullName ?? ""
        )
      );
      const self = loadedGuests.find((g) => g.guestId === current.guestId);
      setMessage(self?.message ?? "");
      setDietary(self?.dietary ?? "");
      setLoading(false);
    }

    loadForSession();
    window.addEventListener(GUEST_SESSION_EVENT, loadForSession);
    return () => window.removeEventListener(GUEST_SESSION_EVENT, loadForSession);
  }, []);

  const eventGroups = useMemo(() => {
    // Slots answer for the events their login guest is invited to.
    const ownEventSlugs = new Set(
      invites.filter((i) => i.guestId === session?.guestId).map((i) => i.eventSlug)
    );

    return weddingEvents
      .map((event) => {
        // An open-invite guest is only a login, not an invitee — their own
        // row is hidden and only their named slots respond.
        const guestRows: ResponseRow[] = openSlots
          ? []
          : guests
              .map((guest): ResponseRow | null => {
                const invite = invites.find(
                  (i) => i.guestId === guest.guestId && i.eventSlug === event.eventid
                );
                if (!invite) return null;
                return {
                  key: guest.guestId,
                  fullName: guest.fullName,
                  status: invite.status,
                  inMemoriam: guest.inMemoriam,
                  save: (eventSlug: string, value: InviteStatus) =>
                    handleStatusChange(guest.guestId, eventSlug, value),
                };
              })
              .filter((r): r is ResponseRow => r !== null);

        const slotRows: ResponseRow[] = ownEventSlugs.has(event.eventid)
          ? slots.map((slot) => ({
              key: `slot-${slot.slotId}`,
              fullName: slot.fullName,
              status:
                slotInvites.find((i) => i.slotId === slot.slotId && i.eventSlug === event.eventid)
                  ?.status ?? null,
              save: (eventSlug: string, value: InviteStatus) =>
                handleSlotStatusChange(slot.slotId, eventSlug, value),
            }))
          : [];

        return { event, responses: [...guestRows, ...slotRows] };
      })
      .filter((group) => group.responses.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingEvents, guests, invites, openSlots, slots, slotInvites, session]);

  async function handleStatusChange(guestId: string, eventSlug: string, value: string) {
    if (session?.lockRsvp) return;
    if (value !== "attending" && value !== "not_attending" && value !== "undecided") return;
    const status = value;

    setInvites((prev) =>
      prev.map((invite) =>
        invite.guestId === guestId && invite.eventSlug === eventSlug ? { ...invite, status } : invite
      )
    );

    await fetch("/api/rsvp/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, eventSlug, status }),
    });
  }

  async function handleSlotStatusChange(slotId: string, eventSlug: string, status: InviteStatus) {
    if (session?.lockRsvp) return;

    setSlotInvites((prev) => [
      ...prev.filter((i) => !(i.slotId === slotId && i.eventSlug === eventSlug)),
      { slotId, eventSlug, status },
    ]);

    await fetch("/api/rsvp/slots/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: session?.guestId, slotId, eventSlug, status }),
    });
  }

  async function handleSlotNameBlur(slotNumber: number) {
    if (!session || session.lockRsvp) return;
    const typed = (slotNames[slotNumber - 1] ?? "").trim();
    const existing = slots.find((slot) => slot.slotNumber === slotNumber);
    if (typed === (existing?.fullName ?? "")) return;

    const response = await fetch("/api/rsvp/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: session.guestId, slotNumber, fullName: typed }),
    });
    if (!response.ok) return;

    const { slot } = (await response.json()) as { slot: Slot | null };
    setSlots((prev) => {
      const without = prev.filter((s) => s.slotNumber !== slotNumber);
      return slot ? [...without, slot].sort((a, b) => a.slotNumber - b.slotNumber) : without;
    });
    if (!slot && existing) {
      // Clearing a name also drops that slot's answers on the server.
      setSlotInvites((prev) => prev.filter((i) => i.slotId !== existing.slotId));
    }
  }

  async function handleSaveDietary() {
    if (!session) return;
    setDietaryStatus("saving");
    await fetch("/api/rsvp/dietary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: session.guestId, dietary }),
    });
    setDietaryStatus("saved");
    window.setTimeout(() => setDietaryStatus("idle"), 2000);
  }

  async function handleSendMessage() {
    if (!session) return;
    setMessageStatus("saving");
    await fetch("/api/rsvp/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: session.guestId, message }),
    });
    setMessageStatus("saved");
    window.setTimeout(() => setMessageStatus("idle"), 2000);
  }

  if (loading) {
    return <p className="mx-auto w-full max-w-4xl font-secondary text-primary/60">Loading your invitation...</p>;
  }

  if (!session) {
    return (
      <p className="mx-auto w-full max-w-4xl font-secondary text-primary/60">
        Please log in to view your RSVP.
      </p>
    );
  }

  if (session.householdId === MASTER_HOUSEHOLD) {
    return <MasterSummary guestId={session.guestId} weddingEvents={weddingEvents} />;
  }

  if (session.hideRsvp) {
    return (
      <p className="mx-auto w-full max-w-4xl font-secondary text-primary/60">
        This page isn&apos;t available for your invitation.
      </p>
    );
  }

  // Narrower than the page's own container (which is sized for the master
  // account's wide table) — a personal RSVP reads better at the old width.
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-16">
      {session.lockRsvp && (
        <p className="font-secondary text-2xl text-notify">
          RSVP&apos;s are now locked. If you are unable to attend an event, please
          contact Vinally or Rushi directly.
        </p>
      )}

      {openSlots ? (
        <div>
          <h2 className="font-primary text-xl text-quinary">Who&apos;s attending from your party?</h2>
          <p className="mt-1 mb-4 font-secondary text-sm text-notify">
            {session.lockRsvp
              ? "Your guest names are locked."
              : `Enter the name of each guest attending (up to ${openSlots}), then RSVP for them below.`}
          </p>
          <div className="flex flex-col gap-3 sm:max-w-sm">
            {slotNames.map((name, i) =>
              session.lockRsvp ? (
                <p key={i} className="font-secondary text-base text-primary">
                  <span className="text-primary/50">Guest {i + 1}: </span>
                  {name || "—"}
                </p>
              ) : (
                <input
                  key={i}
                  type="text"
                  value={name}
                  maxLength={100}
                  placeholder={`Guest ${i + 1}`}
                  autoComplete="off"
                  onChange={(e) =>
                    setSlotNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))
                  }
                  onBlur={() => handleSlotNameBlur(i + 1)}
                  className="h-10 rounded-full border border-primary/30 bg-transparent px-4 font-secondary text-base text-primary placeholder:text-primary/40 focus:border-quinary focus:outline-none"
                />
              )
            )}
          </div>
        </div>
      ) : null}

      {/* One shared grid for every event so column widths (especially the
          event-block column, which is "auto" width) are computed once
          across all content — splitting this into a separate grid per
          event let each one size its own columns independently, so the
          name/picklist columns didn't line up between different events. */}
      <div className="grid grid-cols-1 items-center gap-x-6 gap-y-4 sm:grid-cols-[auto_1fr_auto]">
        {eventGroups.map(({ event, responses }, groupIndex) => (
          <Fragment key={event.eventid}>
            {groupIndex > 0 && (
              <div className="col-span-1 py-4 sm:col-span-3">
                <div className="h-[1.5px] w-full bg-primary/10" />
              </div>
            )}

            <div
              className="flex items-center gap-3 self-start sm:[grid-row:span_var(--rsvp-rows)]"
              style={{ "--rsvp-rows": responses.length } as CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getSvgIconUrl(event.eventid)}
                alt=""
                className="h-14 w-14 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getSvgFallbackUrl();
                }}
              />
              <div>
                <h2 className="font-primary text-xl text-quinary">{event.name}</h2>
                <p className="font-secondary text-sm text-primary/70">
                  {formatEventDate(event.dateTime, event.timezone)}
                </p>
              </div>
            </div>

            {responses.map((response) => (
              <Fragment key={response.key}>
                <p className="font-secondary text-base text-primary sm:text-center">
                  {response.fullName}
                </p>
                {response.inMemoriam ? (
                  // Keeps the grid cell (and row height) but shows nothing.
                  <span aria-hidden className="h-10" />
                ) : session.lockRsvp ? (
                  <p className="font-secondary text-sm text-primary/50 sm:justify-self-center">
                    {response.status ? STATUS_LABELS[response.status] : "—"}
                  </p>
                ) : (
                  <select
                    value={response.status ?? ""}
                    onChange={(e) => response.save(event.eventid, e.target.value as InviteStatus)}
                    className="h-10 rounded-full border border-primary/30 bg-transparent px-4 font-secondary text-sm text-primary focus:border-quinary focus:outline-none sm:justify-self-center"
                  >
                    {/* Once a real choice has been made, "—" is removed for good —
                        they can only move between Attending / Not Attending /
                        Undecided from then on, never back to no-response-yet. */}
                    {response.status === null && <option value="">—</option>}
                    <option value="attending">Attending</option>
                    <option value="not_attending">Not Attending</option>
                    {response.status !== null && <option value="undecided">Undecided</option>}
                  </select>
                )}
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>

      <div className="mt-8">
        <p className="mb-2 font-secondary text-sm uppercase tracking-wide text-primary/70">
          Dietary restrictions
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            maxLength={300}
            autoComplete="off"
            className="h-10 flex-1 rounded-full border border-primary/30 bg-transparent px-4 font-secondary text-base text-primary focus:border-quinary focus:outline-none sm:text-sm"
          />
          <button
            type="button"
            onClick={handleSaveDietary}
            className="rounded-full bg-quinary px-6 py-2.5 font-secondary text-sm font-bold text-tertiary transition-all duration-300 ease-out hover:shadow-md active:scale-95"
          >
            {dietaryStatus === "saving" ? "..." : dietaryStatus === "saved" ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="-mt-8">
        <p className="mb-2 font-secondary text-sm uppercase tracking-wide text-primary/70">
          Notes / Send a message to Vinally &amp; Rushi
        </p>
        <div className="flex items-start gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="flex-1 rounded-2xl border border-primary/30 bg-transparent p-3 font-secondary text-sm text-primary focus:border-quinary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="rounded-full bg-quinary px-6 py-2.5 font-secondary text-sm font-bold text-tertiary transition-all duration-300 ease-out hover:shadow-md active:scale-95"
          >
            {messageStatus === "saving" ? "..." : messageStatus === "saved" ? "Sent" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
