import Image from "next/image";
import { getLocations } from "@/data/locations";
import { imageExistsInPublic } from "@/lib/imageExists";

// Hotels come straight from the `locations` table — render on every request
// so adding, editing or removing a hotel row shows up without a redeploy.
export const dynamic = "force-dynamic";

/** "Primary" hotels lead; everything else follows alphabetically. */
function compareHotels(a: { description?: string; name: string }, b: { description?: string; name: string }) {
  const aPrimary = /^primary/i.test(a.description ?? "") ? 0 : 1;
  const bPrimary = /^primary/i.test(b.description ?? "") ? 0 : 1;
  return aPrimary - bPrimary || a.name.localeCompare(b.name);
}

export default async function AccommodationPage() {
  const locations = await getLocations();
  const hotels = locations.filter((loc) => loc.category === "hotel").sort(compareHotels);

  return (
    <div className="flex flex-1 flex-col py-4 sm:py-6">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h1 className="font-primary text-4xl text-primary sm:text-5xl mb-8">
          Hotels
        </h1>

        <p className="mb-12 text-xl text-primary/70">
          Working on hotel codes and additional options. Please reach out to Rushi or Vinally directly for any questions!
        </p>

        <div className="flex flex-col gap-12">
          {hotels.map((hotel) => {
            const imagePath = `/images/hotels/${hotel.id}.jpg`;
            const hasImage = imageExistsInPublic(imagePath);

            return (
              <div
                key={hotel.id}
                className={`grid grid-cols-1 items-center gap-8 ${hasImage ? "sm:grid-cols-2 sm:gap-10" : ""}`}
              >
                {hasImage && (
                  <div className="liquid-glass-lite-frame relative aspect-[4/3] overflow-hidden rounded-3xl">
                    <Image
                      src={imagePath}
                      alt={hotel.name}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {hotel.description && (
                    <h2 className="mb-4 font-secondary text-3xl text-primary sm:text-4xl">
                      {hotel.description}
                    </h2>
                  )}
                  <h3 className="font-secondary text-xl text-primary font-bold">{hotel.name}</h3>
                  <p className="text-sm text-primary/70">{hotel.address}</p>
                  {hotel.detail1 && <p className="text-sm text-primary/60">{hotel.detail1}</p>}
                  {hotel.detail2 && <p className="text-sm text-primary/60">{hotel.detail2}</p>}
                  {hotel.detail3 && <p className="text-sm text-primary/60">{hotel.detail3}</p>}
                  {hotel.link && (
                    <a
                      href={hotel.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block pt-1 text-sm text-primary underline underline-offset-4 transition-colors hover:text-quinary"
                    >
                      Hotel website &#8599;
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
