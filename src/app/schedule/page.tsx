import Timeline, { type TimelineEventConfig } from "@/components/timeline/Timeline";
import TimelineMobileView from "@/components/timeline/TimelineMobileView";
import { weddingEvents } from "@/data/weddingDetails";
import { imageExistsInPublic } from "@/lib/imageExists";
import { readPublicFile } from "@/lib/readPublicFile";
import { formatDateShort } from "@/lib/formatDate";

const SVG_PATH = "images/schedule/schedule.svg";

const POSITIONS: Array<"above" | "below" | "left" | "right"> = [
  "above",
  "left",
  "above",
  "right",
  "below",
];

export default function SchedulePage() {
  const svgMarkup = imageExistsInPublic(SVG_PATH) ? readPublicFile(SVG_PATH) : null;

  const events: TimelineEventConfig[] = weddingEvents.map((event, index) => {
    const percent = weddingEvents.length > 1 ? index / (weddingEvents.length - 1) : 0;

    return {
      percent,
      eventId: event.eventid,
      title: event.name,
      date: formatDateShort(event.dateTime),
      position: POSITIONS[index] || "above",
    };
  });

  return (
    <div className="flex flex-1 flex-col py-4 sm:py-6">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="font-primary text-4xl text-primary sm:text-5xl mb-12">
          Schedule
        </h1>
      </div>
      <div className="flex flex-1 flex-col items-center">
        {svgMarkup ? (
          <>
            <div className="w-full md:hidden px-6">
              <TimelineMobileView svgMarkup={svgMarkup} events={events} />
            </div>

            <div className="w-full max-w-4xl hidden md:block">
              <Timeline svgMarkup={svgMarkup} events={events} />
            </div>
          </>
        ) : (
          <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-primary/20 p-12 text-center">
            <span className="text-xs text-primary/50">Add SVG</span>
            <span className="font-mono text-[10px] text-primary/40">
              public/{SVG_PATH}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
