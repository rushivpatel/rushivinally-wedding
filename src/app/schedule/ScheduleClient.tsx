"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "lucide-react";
import type { WeddingEvent } from "@/data/weddingDetails";
import { formatEventDate, formatEventTime, getEventDateKey } from "@/lib/formatDate";
import { getSvgIconUrl, getSvgFallbackUrl } from "@/lib/loadSvgIcon";
import { getGuestSession, GUEST_SESSION_EVENT } from "@/lib/guestSession";
import { generateMapsLink } from "@/lib/generateMapsLink";
import { downloadIcsFile } from "@/lib/generateCalendarLink";

type ScheduleClientProps = {
  weddingEvents: WeddingEvent[];
};

type DayGroup = {
  dateKey: string;
  events: WeddingEvent[];
};

/** For calendar purposes an event should start at its earliest known
 *  time (e.g. Baraat, not the Wedding Ceremony anchor time) and run
 *  through its last segment plus a buffer, rather than a flat 2 hours
 *  from the anchor time which could end before a later segment starts. */
function getCalendarWindow(event: WeddingEvent): { dateTime: string; durationHours: number } {
  const times = [event.dateTime, ...event.segments.map((segment) => segment.dateTime)].map(
    (t) => new Date(t).getTime()
  );
  const start = Math.min(...times);
  const end = Math.max(...times);
  const bufferHours = 2;
  const durationHours = (end - start) / (1000 * 60 * 60) + bufferHours;

  return { dateTime: new Date(start).toISOString(), durationHours };
}

function groupByDay(events: WeddingEvent[]): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const event of events) {
    const dateKey = getEventDateKey(event.dateTime);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.dateKey === dateKey) {
      lastGroup.events.push(event);
    } else {
      groups.push({ dateKey, events: [event] });
    }
  }

  return groups;
}

export default function ScheduleClient({ weddingEvents }: ScheduleClientProps) {
  const [visibleEvents, setVisibleEvents] = useState(weddingEvents);

  useEffect(() => {
    function applySession() {
      const session = getGuestSession();
      if (!session) return;

      setVisibleEvents(
        weddingEvents.filter((event) => session.invitedEventSlugs.includes(event.eventid))
      );
    }

    applySession();
    window.addEventListener(GUEST_SESSION_EVENT, applySession);
    return () => window.removeEventListener(GUEST_SESSION_EVENT, applySession);
  }, [weddingEvents]);

  const dayGroups = useMemo(() => groupByDay(visibleEvents), [visibleEvents]);

  return (
    <div className="flex flex-col items-center gap-30">
      {dayGroups.map((day) => (
        <div key={day.dateKey} className="flex w-full max-w-xl flex-col items-center gap-10">
          <p className="font-primary text-3xl uppercase tracking-widest text-primary sm:whitespace-nowrap">
            {formatEventDate(day.events[0].dateTime)}
          </p>

          {day.events.map((event) => (
            <div key={event.eventid} className="flex flex-col items-center gap-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getSvgIconUrl(event.eventid)}
                alt=""
                className="my-2 h-20 w-20 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getSvgFallbackUrl();
                }}
              />

              <h2 className="font-primary text-2xl uppercase tracking-widest text-quinary">
                {event.name}
              </h2>

              {event.segments.length > 0 ? (
                <div className="space-y-1">
                  {event.segments.map((segment) => (
                    <p key={segment.name} className="font-secondary text-lg text-secondary">
                      {segment.name} · {formatEventTime(segment.dateTime)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-secondary text-lg text-secondary">{formatEventTime(event.dateTime)}</p>
              )}

              <div className="mt-2 space-y-1">
                <p className="font-secondary text-lg text-primary">{event.locationName}</p>
                <p className="font-secondary text-base italic text-primary/70">{event.locationAddress}</p>
              </div>

              {/* Attire hidden until real attire_colors/attire_type values are
                  set in Supabase — currently placeholder text. Re-add:
                  <div className="mt-2 space-y-1">
                    <p className="font-secondary text-base text-primary">Attire | {event.attireColors}</p>
                    <p className="font-secondary text-base text-primary">{event.attireType}</p>
                  </div> */}

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    downloadIcsFile({
                      name: event.name,
                      ...getCalendarWindow(event),
                      locationName: event.locationName,
                      locationAddress: event.locationAddress,
                      attireType: event.attireType,
                      attireColors: event.attireColors,
                    })
                  }
                  className="rounded-full bg-quinary px-8 py-3 font-secondary text-sm font-bold tracking-wide text-tertiary shadow-[0_4px_12px_rgba(184,150,90,0.35)] transition-all duration-300 ease-out hover:shadow-[0_6px_16px_rgba(184,150,90,0.45)] active:scale-95"
                >
                  Add to Calendar
                </button>
                <a
                  href={generateMapsLink(event.locationAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/70 transition-colors hover:text-primary"
                  aria-label={`Navigate to ${event.locationName}`}
                >
                  <Navigation size={22} />
                </a>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
