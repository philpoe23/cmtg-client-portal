"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Old content fades out, then the container eases to the new height while the
 *  incoming content fades in behind the tail of that ease. */
const FADE_OUT_MS = 200;
const HEIGHT_MS = 300;
const FADE_IN_DELAY_MS = 150;
const FADE_IN_MS = 300;

interface StepFadeProps {
  /** Which entry of `steps` to show. Changing it fades to the new one. */
  stepKey: string;
  /** Every step, rebuilt by the parent on each render. */
  steps: Record<string, ReactNode>;
  className?: string;
}

/**
 * Cross-fades between steps without unmounting the surrounding shell.
 *
 * Steps arrive as a map rather than as children so that the displayed one is
 * always the parent's current render of it. Holding a snapshot instead would
 * freeze every controlled input underneath — the captured element keeps
 * rendering the value it was captured with, so typing updates the parent's
 * state and nothing appears on screen.
 *
 * Only `displayKey` is state; the fade is derived from it. Height is driven off
 * a ResizeObserver rather than off the step key, so the container also follows
 * growth *within* a step — the enrollment card trading its skeleton for the
 * real QR code is a height change with no key change, and animating that falls
 * out for free.
 *
 * Honours prefers-reduced-motion by swapping instantly.
 */
export function StepFade({ stepKey, steps, className }: StepFadeProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // The step on screen. It lags `stepKey` for FADE_OUT_MS so the outgoing step
  // stays mounted long enough to fade.
  const [displayKey, setDisplayKey] = useState(stepKey);
  const [height, setHeight] = useState<number>();

  const fadingOut = displayKey !== stepKey;

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const sync = () => setHeight(el.getBoundingClientRect().height);
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!fadingOut) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const swap = setTimeout(() => setDisplayKey(stepKey), reduced ? 0 : FADE_OUT_MS);
    return () => clearTimeout(swap);
  }, [fadingOut, stepKey]);

  return (
    <div
      style={{
        // Transitioning from `auto` to a length does not animate, so the first
        // measured height lands without a visible animation on mount.
        ...(height === undefined ? {} : { height }),
        transitionDuration: `${HEIGHT_MS}ms`,
      }}
      className={cn(
        "transition-[height] ease-out motion-reduce:transition-none",
        // Clip only while fading out: a permanently hidden overflow would cut
        // off focus rings on the inputs once the card is at rest.
        fadingOut ? "overflow-hidden" : "overflow-visible",
        className
      )}
    >
      {/* Stable wrapper: the ResizeObserver attaches here once, so the keyed
          child below can remount per step without detaching it. */}
      <div
        ref={contentRef}
        style={{
          transitionDuration: `${fadingOut ? FADE_OUT_MS : FADE_IN_MS}ms`,
          // The incoming step waits out the first half of the height ease
          // rather than fading in on top of a still-resizing card.
          transitionDelay: `${fadingOut ? 0 : FADE_IN_DELAY_MS}ms`,
        }}
        className={cn(
          "transition-opacity ease-out motion-reduce:transition-none",
          fadingOut ? "opacity-0" : "opacity-100"
        )}
      >
        <div key={displayKey}>{steps[displayKey]}</div>
      </div>
    </div>
  );
}
