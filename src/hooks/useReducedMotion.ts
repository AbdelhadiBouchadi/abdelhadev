import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MEDIA } from "@/lib/motion";

/** False on the server. */
export function useReducedMotion(): boolean {
  return useMediaQuery(MEDIA.reduce);
}
