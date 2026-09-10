"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { WeddingEvent } from "@/data/weddingDetails";
import { formatEventDate } from "@/lib/formatDate";
import { getSvgIconUrl, getSvgFallbackUrl } from "@/lib/loadSvgIcon";
import { getGuestSession, GUEST_SESSION_EVENT, type GuestSession } from "@/lib/guestSession";

type InviteStatus = "attending" | "not_attending" | "undecided";

type HouseholdGuest = { guestId: string; fullName: string; message: string | null };
type Invite = { guestId: string; eventSlug: string; status: InviteStatus | null };

type RsvpClientProps = {
  weddingEvents: WeddingEvent[];
};

export default function RsvpClient({ weddingEvents }: RsvpClientProps) {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [guests, setGuests] = useState<HouseholdGuest[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForSession() {
      const current = getGuestSession();
      setSession(current);
      if (!current) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/rsvp?guestId=${current.guestId}`);
      const data = await response.json();
      const loadedGuests: HouseholdGuest[] = data.guests ?? [];
      setGuests(loadedGuests);
      setInvites(data.invites ?? []);
      const self = loadedGuests.find((g) => g.guestId === current.guestId);
      setMessage(self?.message ?? "");
      setLoading(false);
    }

    loadForSession();
    window.addEventListener(GUEST_SESSION_EVENT, loadForSession);
    return () => window.removeEventListener(GUEST_SESSION_EVENT, loadForSession);
  }, []);

  const eventGroups = useMemo(() => {
    return weddingEvents
      .map((event) => {
        const responses = guests
          .map((guest) => {
            const invite = invites.find(
              (i) => i.guestId === guest.guestId && i.eventSlug === event.eventid
            );
            if (!invite) return null;
            return { guestId: guest.guestId, fullName: guest.fullName, status: invite.status };
          })
          .filter((r): r is { guestId: string; fullName: string; status: InviteStatus | null } => r !== null);

        return { event, responses };
      })
      .filter((group) => group.responses.length > 0);
  }, [weddingEvents, guests, invites]);

  async function handleStatusChange(guestId: string, eventSlug: string, value: string) {
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
    return <p className="font-secondary text-primary/60">Loading your invitation...</p>;
  }

  if (!session) {
    return <p className="font-secondary text-primary/60">Please log in to view your RSVP.</p>;
  }

  return (
    <div className="flex flex-col gap-16">
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
              <Fragment key={response.guestId}>
                <p className="font-secondary text-base text-primary sm:text-center">
                  {response.fullName}
                </p>
                <select
                  value={response.status ?? ""}
                  onChange={(e) => handleStatusChange(response.guestId, event.eventid, e.target.value)}
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
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>

      <div className="mt-8">
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
