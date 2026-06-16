'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  duration?: number;
  format?: (n: number) => string;
};

export default function AnimatedNumber({ value, duration = 900, format }: Props) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      displayRef.current = 0;
      return;
    }

    const start = displayRef.current;
    const delta = value - start;
    const startedAt = performance.now();
    let rafId = 0;
    let active = true;

    const tick = (now: number) => {
      if (!active) return;
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(start + delta * eased);
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        displayRef.current = value;
        setDisplay(value);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [value, duration]);

  const text = format ? format(display) : String(display);
  return <span className="animated-number">{text}</span>;
}
