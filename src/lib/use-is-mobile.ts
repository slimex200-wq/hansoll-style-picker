"use client";

import { useSyncExternalStore } from "react";

/**
 * Reactive media-query hook for the mobile breakpoint used by the handoff
 * shell. Uses useSyncExternalStore so we observe the live MediaQueryList
 * without triggering set-state-in-effect cascades. SSR returns false so
 * markup matches the desktop default before hydration; the first client
 * render then snaps to the actual viewport state.
 */
function makeSubscribe(breakpoint: number) {
  return (onChange: () => void) => {
    if (typeof window === "undefined" || !window.matchMedia) return () => {};
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
}

function makeGetSnapshot(breakpoint: number) {
  return () => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  };
}

const getServerSnapshot = () => false;

export function useIsMobile(breakpoint: number = 940): boolean {
  return useSyncExternalStore(
    makeSubscribe(breakpoint),
    makeGetSnapshot(breakpoint),
    getServerSnapshot
  );
}
