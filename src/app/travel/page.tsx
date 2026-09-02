import Image from "next/image";
import { getLocations } from "@/data/locations";

export default async function TravelPage() {
  const locations = await getLocations();
  const airports = locations.filter((loc) => loc.category === "airport");

  return (
    <div className="flex flex-1 flex-col py-4 sm:py-6">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="font-primary text-4xl text-primary sm:text-5xl mb-12">Travel</h1>

        {/* Map Image Placeholder */}
        <div className="mb-12">
          <div className="liquid-glass-lite-frame relative overflow-hidden rounded-3xl">
            {/* Mobile version */}
            <Image
              src="/images/travel/venue-map-mobile.png"
              alt="Wedding venue and airports map"
              width={600}
              height={800}
              className="w-full sm:hidden"
              priority
            />
            {/* Desktop version */}
            <Image
              src="/images/travel/venue-map.png"
              alt="Wedding venue and airports map"
              width={800}
              height={600}
              className="hidden w-full sm:block"
              priority
            />
          </div>
        </div>

        {/* Airports Section */}
        <div>
          <h2 className="mb-8 font-primary text-4xl text-primary">Airports</h2>
          <div className="space-y-8">
            {airports.map((airport) => (
              <div key={airport.id} className="space-y-2">
                <h3 className="font-primary text-xl text-primary font-bold">{airport.name}</h3>
                <p className="text-sm text-primary/70">{airport.address}</p>
                {airport.detail1 && <p className="text-sm text-primary/60">{airport.detail1}</p>}
                {airport.detail2 && <p className="text-sm text-primary/60">{airport.detail2}</p>}
                {airport.detail3 && <p className="text-sm text-primary/60">{airport.detail3}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
