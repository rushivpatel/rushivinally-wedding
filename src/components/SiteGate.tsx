"use client";

import { useEffect, useState } from "react";
import PasswordGate from "@/components/PasswordGate";

const STORAGE_KEY = "vr-wedding-auth";

export default function SiteGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      setIsUnlocked(true);
    }
  }, []);

  return (
    <>
      {children}
      {!isUnlocked && (
        <PasswordGate onUnlock={() => setIsUnlocked(true)} />
      )}
    </>
  );
}
