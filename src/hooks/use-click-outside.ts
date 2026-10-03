"use client";

import { useEffect, useRef } from "react";

/** Calls onOutside when the user clicks anywhere outside the returned ref. Used by dropdown menus. */
export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handle(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onOutside]);

  return ref;
}
