import { useEffect, useLayoutEffect } from "react";

/** useEffect on the server, where useLayoutEffect warns. */
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
