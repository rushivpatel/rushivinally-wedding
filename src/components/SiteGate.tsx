"use client";

import { useEffect, useState } from "react";
import LoginGate from "@/components/LoginGate";
import { getGuestSession } from "@/lib/guestSession";

export default function SiteGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (getGuestSession()) {
      setIsUnlocked(true);
    }
  }, []);

  return (
    <>
      {children}
      {!isUnlocked && (
        <LoginGate onUnlock={() => setIsUnlocked(true)} />
      )}
    </>
  );
}
