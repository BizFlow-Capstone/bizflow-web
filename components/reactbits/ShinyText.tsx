"use client";

import { useState, useCallback, useRef } from "react";
import {
  motion,
  useMotionValue,
  useAnimationFrame,
  useTransform,
} from "motion/react";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  delay?: number;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 2,
  className = "",
  color = "#b5b5b5",
  shineColor = "#ffffff",
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = "left",
  delay = 0,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const directionRef = useRef(direction === "left" ? 1 : -1);

  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  useAnimationFrame((time) => {
    if (disabled || isPaused) {
      lastTimeRef.current = null;
      return;
    }

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    const totalCycle = animationDuration + delayDuration;

    if (yoyo) {
      const fullYoyoCycle = totalCycle * 2;
      const cycleTime = elapsedRef.current % fullYoyoCycle;

      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100 * directionRef.current;
        progress.set(p);
      } else if (cycleTime < totalCycle) {
        progress.set(100 * directionRef.current);
      } else if (cycleTime < totalCycle + animationDuration) {
        const p =
          (1 - (cycleTime - totalCycle) / animationDuration) *
          100 *
          directionRef.current;
        progress.set(p);
      } else {
        progress.set(0);
      }
    } else {
      const cycleTime = elapsedRef.current % totalCycle;
      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100 * directionRef.current;
        progress.set(p);
      } else {
        progress.set(0);
      }
    }
  });

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  const backgroundPosition = useTransform(progress, (p) => `${p}% 50%`);

  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 25%, ${shineColor} 50%, ${color} 75%)`,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ ...gradientStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </motion.span>
  );
};

export default ShinyText;
