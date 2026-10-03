"use client";

import { useEffect, useRef, useState } from "react";

const ROOT_MARGIN = "300px";

/** Tells a section when it first scrolls near the viewport, so it can load only then. */
export function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
