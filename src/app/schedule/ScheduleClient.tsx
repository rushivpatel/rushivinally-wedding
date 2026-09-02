"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Navigation } from "lucide-react";
import type { WeddingEvent } from "@/data/weddingDetails";
import { formatEventDate, formatEventDateTime, formatEventTime } from "@/lib/formatDate";
import { getSvgIconUrl, getSvgFallbackUrl } from "@/lib/loadSvgIcon";
import { getGuestSession } from "@/lib/guestSession";
import { generateMapsLink } from "@/lib/generateMapsLink";
import { downloadIcsFile } from "@/lib/generateCalendarLink";

type ScheduleClientProps = {
  weddingEvents: WeddingEvent[];
};

export default function ScheduleClient({ weddingEvents }: ScheduleClientProps) {
  const [visibleEvents, setVisibleEvents] = useState(weddingEvents);

  useEffect(() => {
    const session = getGuestSession();
    if (!session) return;

    setVisibleEvents(
      weddingEvents.filter((event) => session.invitedEventSlugs.includes(event.eventid))
    );
  }, [weddingEvents]);

  return (
    <div className="flex flex-col items-center gap-10">
      {visibleEvents.map((event) => (
        <div key={event.eventid} className="flex w-full max-w-lg items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getSvgIconUrl(event.eventid)}
            alt=""
            className="h-32 w-32 shrink-0 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getSvgFallbackUrl();
            }}
          />
          <div className="flex flex-1 items-start justify-between gap-2">
            <div className="space-y-1 text-left">
              <h2 className="font-primary text-3xl text-primary">{event.name}</h2>
              {event.segments.length > 0 ? (
                <>
                  <p className="text-base text-primary/70">{formatEventDate(event.dateTime)}</p>
                  {event.segments.map((segment) => (
                    <p key={segment.name} className="text-base text-primary/70">
                      {segment.name} · {formatEventTime(segment.dateTime)}
                    </p>
                  ))}
                </>
              ) : (
                <p className="text-base text-primary/70">{formatEventDateTime(event.dateTime)}</p>
              )}
              <p className="text-base text-primary/70">{event.locationName}</p>
              <p className="text-sm text-primary/60">{event.locationAddress}</p>
            </div>
            <div className="mt-1 flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  downloadIcsFile({
                    name: event.name,
                    dateTime: event.dateTime,
                    locationName: event.locationName,
                    locationAddress: event.locationAddress,
                    attireType: event.attireType,
                    attireColors: event.attireColors,
                  })
                }
                className="text-primary/70 transition-colors hover:text-primary"
                aria-label={`Add ${event.name} to calendar`}
              >
                <CalendarPlus size={25} />
              </button>
              <a
                href={generateMapsLink(event.locationAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/70 transition-colors hover:text-primary"
                aria-label={`Navigate to ${event.locationName}`}
              >
                <Navigation size={25} />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
