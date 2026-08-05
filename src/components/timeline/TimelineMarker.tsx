import { getSvgIconUrl, getSvgFallbackUrl } from "@/lib/loadSvgIcon";

type TimelineMarkerProps = {
  eventId: string;
  revealed: boolean;
};

export default function TimelineMarker({
  eventId,
  revealed,
}: TimelineMarkerProps) {
  return (
    <div
      className={`timeline-marker${revealed ? " is-revealed" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getSvgIconUrl(eventId)}
        alt=""
        className="timeline-marker__icon"
        onError={(e) => {
          (e.target as HTMLImageElement).src = getSvgFallbackUrl();
        }}
      />
    </div>
  );
}
