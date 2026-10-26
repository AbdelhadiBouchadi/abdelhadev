import type { ReactNode } from "react";
import { ThreadMotion } from "@/components/sections/about/ThreadMotion";
import { ThreadLine } from "@/components/sections/about/diagrams/ThreadLine";

export interface ThreadZoneProps {
  children: ReactNode;
}

export function ThreadZone({ children }: ThreadZoneProps) {
  return (
    <div className="thread-zone">
      <ThreadLine />
      {children}
      <ThreadMotion />
    </div>
  );
}
