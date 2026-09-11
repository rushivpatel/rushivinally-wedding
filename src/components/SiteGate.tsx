"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoginGate from "@/components/LoginGate";
import { getGuestSession, refreshGuestSession } from "@/lib/guestSession";

export default function SiteGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (getGuestSession()) {
      setIsUnlocked(true);
    }
  }, []);

  // Re-validates the cached session's flags (hideRsvp, isSimpleInvite,
  // invitedEventSlugs) against Supabase on every page visited, so a
  // change made there reaches an already-logged-in guest without
  // requiring them to log out or clear storage.
  useEffect(() => {
    refreshGuestSession();
  }, [pathname]);

  return (
    <>
      {children}
      {!isUnlocked && (
        <LoginGate onUnlock={() => setIsUnlocked(true)} />
      )}
    </>
  );
}
