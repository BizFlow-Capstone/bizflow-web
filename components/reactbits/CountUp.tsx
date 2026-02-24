"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  separator?: string;
  direction?: "up" | "down";
  className?: string;
  startWhen?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function CountUp({
  to,
  from = 0,
  duration = 2,
  separator = "",
  direction = "up",
  className = "",
  startWhen = true,
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 80 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  useEffect(() => {
    if (isInView && startWhen) {
      onStart?.();

      motionValue.set(direction === "down" ? from : to);
    }
  }, [motionValue, isInView, startWhen, from, to, direction, onStart]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        const options: Intl.NumberFormatOptions = {
          useGrouping: !!separator,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        };

        const formattedNumber = Intl.NumberFormat("en-US", options).format(
          latest,
        );

        ref.current.textContent = separator
          ? formattedNumber.replace(/,/g, separator)
          : formattedNumber;
      }

      if (
        (direction === "up" && latest >= to) ||
        (direction === "down" && latest <= from)
      ) {
        onEnd?.();
      }
    });

    return () => unsubscribe();
  }, [springValue, to, from, separator, direction, onEnd]);

  return <span ref={ref} className={className} />;
}
