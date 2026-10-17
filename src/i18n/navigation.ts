/* Locale-aware navigation. Use these instead of next/link and next/navigation (ESLint enforces it). */
import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
