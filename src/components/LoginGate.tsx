"use client";

import { useEffect, useRef, useState } from "react";
import Monogram from "@/components/Monogram";
import { setGuestSession } from "@/lib/guestSession";

type LoginGateProps = {
  onUnlock?: () => void;
};

/** Envelope-opening sequence: flap flips open, then the whole gate fades
 *  out to reveal the site (already mounted behind it) underneath. */
type Stage = "form" | "flap" | "reveal";

const FLAP_MS = 1000;
const REVEAL_MS = 700;
const SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/** Height of the top flap. Shared so the bottom flap's crease can start its
 *  apex at exactly the top flap's point, the way a real envelope's flaps meet. */
const FLAP_HEIGHT = "7rem";

export default function LoginGate({ onUnlock }: LoginGateProps) {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [ambiguous, setAmbiguous] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // iOS Safari detects this field as a contact field and force-zooms to make
  // room for its own "AutoFill Contact" suggestion bar above the keyboard —
  // that happens regardless of font-size and ignores autoComplete="off".
  // Locking the viewport scale while this gate is mounted blocks that,
  // without taking pinch-zoom away from the rest of the site.
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const original = meta?.getAttribute("content") ?? null;
    meta?.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    );
    return () => {
      if (original !== null) meta?.setAttribute("content", original);
    };
  }, []);

  function beginUnlockSequence() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      onUnlock?.();
      return;
    }

    setStage("flap");
    window.setTimeout(() => setStage("reveal"), FLAP_MS);
    window.setTimeout(() => onUnlock?.(), FLAP_MS + REVEAL_MS);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const { match, ambiguous: isAmbiguous } = await response.json();

      if (match) {
        setGuestSession(match);
        setError(false);
        setAmbiguous(false);
        beginUnlockSequence();
        return;
      }

      setError(true);
      setAmbiguous(Boolean(isAmbiguous));
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFormVisible = stage === "form";
  const isRevealing = stage === "reveal";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-tertiary px-6 transition-opacity ${
        isRevealing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${REVEAL_MS}ms` }}
    >
      <form
        onSubmit={handleSubmit}
        style={{ perspective: "1000px" }}
        className={`relative w-full max-w-sm origin-center sm:scale-110 lg:scale-125 ${isShaking ? "animate-shake" : ""}`}
      >
        {/* Envelope face — ONE continuous surface spanning the whole
            envelope, sitting behind the flap. It has to be a single element:
            splitting it into a separate top "collar" and bottom "body" gave
            each its own border, which drew a hard horizontal line straight
            across the middle. A real envelope's face is uninterrupted — the
            only edges on it are the flap creases. */}
        <div
          className="liquid-glass-lite-secondary-flat absolute inset-0 z-0 overflow-hidden rounded-xl"
          style={{
            opacity: isFormVisible ? 1 : 0,
            transition: "opacity 300ms ease-out",
          }}
        >
          {/* Bottom flap — a Λ mirroring the top flap's V, apex meeting the
              top flap's point, spanning to the two bottom corners. Uses the
              same glass class as the top flap so both folds read as the same
              material. Its diagonal edges show as a tone change against the
              face, exactly how the top flap's edges read — no drawn lines
              needed. Clipped with clip-path rather than drawn as an SVG:
              an <svg> is a replaced element and sizes from its viewBox
              aspect ratio rather than stretching to top/bottom offsets,
              which made it overshoot the envelope and get cropped. */}
          <div
            className="liquid-glass-lite-secondary absolute inset-0 rounded-t-xl [clip-path:polygon(50%_0%,100%_100%,0%_100%)]"
            style={{ top: FLAP_HEIGHT,
                filter:
                "drop-shadow(0 14px 12px rgba(0,0,0,0.26)) drop-shadow(0 5px 5px rgba(0,0,0,0.20))",

            }}
          />
        </div>

        {/* Envelope flap — flips open via rotateX, carrying the seal with it.
            The clip-path shape and the overflowing seal are split into two
            layers: clip-path on a parent also clips overflowing children,
            which would crop the seal where it hangs below the flap edge. */}
        <div
          className="relative z- w-full [backface-visibility:hidden]"
          style={{
            height: FLAP_HEIGHT,
            transformOrigin: "top center",
            transform: isFormVisible ? "rotateX(0deg)" : "rotateX(-180deg)",
            transition: `transform ${FLAP_MS}ms ${SPRING_EASE}`,
          }}
        >
          {/* drop-shadow (not box-shadow) follows the clipped triangle's
              actual silhouette, so the shadow falls along the V's diagonals
              onto the face below — reading as a flap lifted slightly off
              the envelope and held down by the seal. A box-shadow would
              just outline the element's unclipped rectangle instead.
              rounded-t-xl matches the face's corner radius: border-radius
              and clip-path intersect, so the flap's top corners round with
              the envelope rather than poking out past it. */}
          <div
            className="liquid-glass-lite-secondary absolute inset-0 rounded-t-xl [clip-path:polygon(0%_0%,100%_0%,50%_100%)]"
            style={{
              filter:
                "drop-shadow(0 14px 12px rgba(0,0,0,0.26)) drop-shadow(0 5px 5px rgba(0,0,0,0.20))",
            }}
          />

          {/* Wax seal, centered on the flap's own point */}
          <div className="absolute bottom-0 left-1/2 flex h-16 w-16 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-quinary/90 via-quinary to-[#9c7a45] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-2px_3px_rgba(0,0,0,0.25),0_4px_10px_rgba(0,0,0,0.25)]">
            <Monogram className="h-12 w-12 text-tertiary drop-shadow-sm" />
          </div>
        </div>

        {/* Login form — sits on the envelope face below the flap. Carries
            no background of its own: the face behind it already provides one
            continuous surface. */}
        <div
          className="relative z-10"
          style={{
            opacity: isFormVisible ? 1 : 0,
            pointerEvents: isFormVisible ? "auto" : "none",
            transition: "opacity 300ms ease-out",
          }}
        >
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 pb-6 pt-9 text-center">
            <p className="font-primary text-sm leading-snug text-primary sm:text-base">
              Please enter your name or email to view your invitation to
              <br />
              Vinally &amp; Rushi&apos;s Wedding
            </p>

            {/* Input and submit sit on one row to keep the envelope's
                bottom section shallow and closer to a real envelope's
                proportions. */}
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (error) setError(false);
                  if (ambiguous) setAmbiguous(false);
                }}
                placeholder="Name or Email"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-[180px] border-0 border-b border-primary bg-transparent py-1 text-center font-secondary text-base tracking-wide text-primary caret-quinary placeholder:text-primary/40 focus:border-quinary focus:outline-none sm:text-xs"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="liquid-glass-lite-secondary-flat shrink-0 rounded-full bg-quinary px-5 py-1.5 font-secondary text-xs tracking-wide text-tertiary font-bold shadow-[0_4px_12px_rgba(184,150,90,0.35)] transition-all duration-300 ease-out hover:shadow-[0_6px_16px_rgba(184,150,90,0.45)] active:scale-95 disabled:opacity-60"
              >
                {isSubmitting ? "..." : "Enter"}
              </button>
            </div>

            {error && (
              <p className="-mt-1 max-w-[260px] text-xs tracking-wide text-red-500/80 font-bold">
                {ambiguous ? (
                  <>
                    We found multiple people with that name — please enter your email
                    instead, or try the name of someone else in your household.
                  </>
                ) : (
                  "We couldn't find your invitation. Please check your name or email."
                )}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
