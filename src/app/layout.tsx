import type { ReactNode } from "react";

// app/not-found.tsx needs a layout above it; the real root layout is app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
