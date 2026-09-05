import { getWeddingEvents } from "@/data/weddingDetails";
import RsvpClient from "./RsvpClient";

export default async function RsvpPage() {
  const weddingEvents = await getWeddingEvents();

  return (
    <div className="flex flex-1 flex-col py-4 sm:py-6">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="font-primary text-4xl text-primary sm:text-5xl mb-12">RSVP</h1>
        <RsvpClient weddingEvents={weddingEvents} />
      </div>
    </div>
  );
}
