import { getWeddingEvents } from "@/data/weddingDetails";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage() {
  const weddingEvents = await getWeddingEvents();

  return (
    <div className="flex flex-1 flex-col py-4 sm:py-6">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="font-primary text-4xl text-primary sm:text-5xl mb-12">
          Schedule
        </h1>
        <ScheduleClient weddingEvents={weddingEvents} />
      </div>
    </div>
  );
}
