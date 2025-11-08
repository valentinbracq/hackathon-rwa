"use client";
import { useEffect, useState } from "react";

// Hydration-safe online status: undefined until mounted, then true/false
export function useOnline() {
  const [online, setOnline] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Initialize on mount to avoid SSR/client mismatch
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}
