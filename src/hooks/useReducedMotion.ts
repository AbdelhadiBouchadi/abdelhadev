import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MEDIA } from "@/lib/motion";

/** True when the visitor asks for reduced motion. False on the server. */
export function useReducedMotion(): boolean {
  return useMediaQuery(MEDIA.reduce);
}
