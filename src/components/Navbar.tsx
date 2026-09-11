"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Monogram from "@/components/Monogram";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { getGuestSession, GUEST_SESSION_EVENT } from "@/lib/guestSession";

const NAV_LINKS = [
  { href: "/", label: "Welcome" },
  { href: "/schedule", label: "Schedule" },
  { href: "/travel", label: "Travel" },
  { href: "/accommodation", label: "Where to Stay" },
  { href: "/things-to-do", label: "Things to Do" },
  { href: "/rsvp", label: "RSVP" },
];

/** Hidden from guests flagged simple_invite — typically distant family
 *  invited to only 1-2 events who won't need trip-planning info. */
const SIMPLE_INVITE_HIDDEN_HREFS = ["/travel", "/accommodation", "/things-to-do"];

type IndicatorRect = { left: number; width: number };

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);
  const [navLinks, setNavLinks] = useState(NAV_LINKS);

  const pillRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    function applySession() {
      const session = getGuestSession();
      if (!session) return;

      const hiddenHrefs = [
        ...(session.isSimpleInvite ? SIMPLE_INVITE_HIDDEN_HREFS : []),
        ...(session.hideRsvp ? ["/rsvp"] : []),
      ];

      setNavLinks(NAV_LINKS.filter((link) => !hiddenHrefs.includes(link.href)));
    }

    applySession();
    window.addEventListener(GUEST_SESSION_EVENT, applySession);
    return () => window.removeEventListener(GUEST_SESSION_EVENT, applySession);
  }, []);

  const activeIndex = navLinks.findIndex((link) => link.href === pathname);
  const targetIndex = hoveredIndex ?? (activeIndex === -1 ? null : activeIndex);

  // Measures the target link's position relative to the pill so the
  // sliding highlight can be placed with plain left/width — re-measures
  // whenever the target changes (hover or route change) and on resize.
  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    const measure = () => {
      const target = targetIndex !== null ? linkRefs.current[targetIndex] : null;
      if (!target) {
        setIndicator(null);
        return;
      }
      const pillRect = pill.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setIndicator({ left: targetRect.left - pillRect.left, width: targetRect.width });
    };

    measure();

    let frame: number;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [targetIndex]);

  return (
    <header className="sticky top-0 z-50 border-b border-quinary/20 bg-tertiary/0 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-0">
        <Link href="/" onClick={() => setIsOpen(false)} className="relative h-24 w-24 shrink-0 text-primary">
          <Monogram className="h-full w-full" />
        </Link>

        <ul
          ref={pillRef}
          onMouseLeave={() => setHoveredIndex(null)}
          className="liquid-glass-lite relative hidden items-center gap-1 rounded-full p-1.5 md:flex"
        >
          {indicator && (
            <span
              aria-hidden="true"
              className="liquid-glass-lite-active absolute inset-y-1.5 rounded-full transition-[left,width] duration-300 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}

          {navLinks.map((link, index) => {
            const isCurrent = pathname === link.href;
            const isHighlighted = isCurrent || hoveredIndex === index;
            return (
              <li key={link.href} className="relative z-10">
                <Link
                  ref={(el) => {
                    linkRefs.current[index] = el;
                  }}
                  href={link.href}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-full px-4 py-2 font-secondary text-sm tracking-wide transition-colors ${
                    isHighlighted ? "text-quinary" : "text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="text-primary md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {isOpen && (
        <ul className="liquid-glass-lite flex flex-col gap-1 border-t border-quinary/20 px-6 py-4 md:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block rounded-xl px-3 py-3 font-secondary text-base tracking-wide transition-colors hover:bg-quaternary hover:text-quinary ${
                    isActive ? "text-quinary" : "text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
}
