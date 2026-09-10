"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { WeddingEvent } from "@/data/weddingDetails";
import { formatEventDateTime } from "@/lib/formatDate";
import { getSvgIconUrl, getSvgFallbackUrl } from "@/lib/loadSvgIcon";
import { getGuestSession, GUEST_SESSION_EVENT, type GuestSession } from "@/lib/guestSession";

type HouseholdGuest = { guestId: string; fullName: string; message: string | null };
type Invite = { guestId: string; eventSlug: string; attending: boolean | null };

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
            return { guestId: guest.guestId, fullName: guest.fullName, attending: invite.attending };
          })
          .filter((r): r is { guestId: string; fullName: string; attending: boolean | null } => r !== null);

        return { event, responses };
      })
      .filter((group) => group.responses.length > 0);
  }, [weddingEvents, guests, invites]);

  async function handleAttendingChange(guestId: string, eventSlug: string, value: string) {
    const attending = value === "yes" ? true : value === "no" ? false : null;
    if (attending === null) return;

    setInvites((prev) =>
      prev.map((invite) =>
        invite.guestId === guestId && invite.eventSlug === eventSlug
          ? { ...invite, attending }
          : invite
      )
    );

    await fetch("/api/rsvp/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, eventSlug, attending }),
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
      {eventGroups.map(({ event, responses }) => (
        <div
          key={event.eventid}
          className="grid grid-cols-1 items-center gap-x-6 gap-y-4 sm:grid-cols-[auto_1fr_auto]"
        >
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
                {formatEventDateTime(event.dateTime, event.timezone)}
              </p>
            </div>
          </div>

          {responses.map((response) => (
            <Fragment key={response.guestId}>
              <p className="font-secondary text-base text-primary sm:text-center">
                {response.fullName}
              </p>
              <select
                value={response.attending === true ? "yes" : response.attending === false ? "no" : ""}
                onChange={(e) => handleAttendingChange(response.guestId, event.eventid, e.target.value)}
                className="h-10 rounded-full border border-primary/30 bg-transparent px-4 font-secondary text-sm text-primary focus:border-quinary focus:outline-none sm:justify-self-center"
              >
                <option value="">—</option>
                <option value="yes">Attending</option>
                <option value="no">Not Attending</option>
              </select>
            </Fragment>
          ))}
        </div>
      ))}

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
