import Image from "next/image";
import Countdown from "@/components/Countdown";
import { getPrimaryEvent } from "@/data/weddingDetails";
import { imageExistsInPublic } from "@/lib/imageExists";
import { formatDateShort } from "@/lib/formatDate";

const HERO_IMAGES = ["hero-1.jpg", "hero-2.jpg", "hero-3.jpg"];

export default async function Home() {
  const primaryEvent = await getPrimaryEvent();

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-6 py-4 text-center sm:py-6">
      <h1 className="font-primary text-6xl text-primary sm:text-7xl">Vinally &#9825; Rushi</h1>

      <div className="grid w-full max-w-6xl grid-cols-3 gap-1.5 sm:gap-2">
        {HERO_IMAGES.map((file) => {
          const relativePath = `images/hero/${file}`;
          const exists = imageExistsInPublic(relativePath);

          return (
            <div
              key={file}
              className="liquid-glass-lite-frame relative aspect-[3/4] overflow-hidden rounded-2xl"
            >
              {exists ? (
                <Image
                  src={`/${relativePath}`}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 480px, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-primary/20 p-2 text-center">
                  <span className="text-xs text-primary/50">Add photo</span>
                  <span className="font-mono text-[10px] text-primary/40">
                    public/images/hero/{file}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="font-primary text-6xl text-primary">{formatDateShort(primaryEvent.dateTime)}</p>

      <Countdown targetDate={primaryEvent.dateTime} />
    </div>
  );
}
