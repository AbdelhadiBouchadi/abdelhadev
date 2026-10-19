/* Runs in <head> before first paint: html.js, html.motion (unless reduced motion is asked for),
   html.arriving after a curtain, and a fail-safe that shows everything if nothing marks the page
   ready in time. */
import { STORAGE_KEYS } from "@/lib/loader";
import { LOADER } from "@/lib/motion";
import { SHELL_CONTENT_ATTR } from "@/lib/shell";

export const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("motion");try{if(sessionStorage.getItem("${STORAGE_KEYS.arriving}")){d.classList.add("arriving");sessionStorage.removeItem("${STORAGE_KEYS.arriving}")}}catch(e){}setTimeout(function(){if(!d.classList.contains("ready")){d.classList.add("loader-off","ready");d.classList.remove("motion","sky");document.querySelectorAll("[${SHELL_CONTENT_ATTR}]").forEach(function(e){e.removeAttribute("inert")})}},${String(LOADER.failsafeMs)})})();`;
