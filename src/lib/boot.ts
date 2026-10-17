/* The blocking boot script, copied from the first <script> of docs/prototype/index.html.
   It runs in <head> before first paint:
   - `js`: JavaScript runs, so the loader may show (CSS: html.js .loader).
   - `motion`: hidden start states apply (CSS under html.motion), unless reduced motion is asked for.
   - `arriving`: a curtain started on the previous page, so the arriving page runs the short loader.
   - the fail-safe: if nothing marked the page ready in time, show everything and drop motion. */
import { STORAGE_KEYS } from "@/lib/loader";
import { LOADER } from "@/lib/motion";

export const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("motion");try{if(sessionStorage.getItem("${STORAGE_KEYS.arriving}")){d.classList.add("arriving");sessionStorage.removeItem("${STORAGE_KEYS.arriving}")}}catch(e){}setTimeout(function(){if(!d.classList.contains("ready")){d.classList.add("loader-off","ready");d.classList.remove("motion","sky")}},${String(LOADER.failsafeMs)})})();`;
