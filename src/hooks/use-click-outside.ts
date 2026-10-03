"use client";

import { useEffect, useRef } from "react";

// Calls onOutside when the user clicks outside the element.
export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    // Checks if the click was outside the element.
    function handle(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onOutside]);

  return ref;
}
