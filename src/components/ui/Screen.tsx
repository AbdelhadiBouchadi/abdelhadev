/* The framed product screen (prototype .screen). With `src` it shows a real screenshot through
   next/image; without it, one of the prototype's four placeholder skeletons, drawn in CSS
   (src/styles/ui.css) and announced by `label` ("Screenshot to come"). Placeholders carry
   data-placeholder="screen" so 08 (real screenshots) can find every one of them.

   The inner element carries data-media-inner: MediaReveal and the stage timelines zoom it while
   the frame around it opens. */
import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ScreenLayout = "agenda" | "record" | "plan" | "invoice";
export type ScreenAspect = "default" | "tall" | "wide";

interface ScreenCommon {
  /** default 16 / 10, tall 4 / 5, wide 21 / 10. */
  aspect?: ScreenAspect;
  /** Renders the screen in a <figure> with this caption. */
  caption?: ReactNode;
  /** Keeps the caption for assistive technology only (prototype work media: `figcaption.sr`). */
  captionHidden?: boolean;
  className?: string;
}

export interface ScreenImageProps extends ScreenCommon {
  src: string | StaticImageData;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  layout?: never;
  label?: never;
}

export interface ScreenPlaceholderProps extends ScreenCommon {
  src?: never;
  /** The skeleton the prototype drew for this kind of screen. */
  layout: ScreenLayout;
  /** Announced in place of the screenshot, e.g. "Screenshot to come" (from messages). */
  label: string;
}

export type ScreenProps = ScreenImageProps | ScreenPlaceholderProps;

const AGENDA = "a.b.c.a..bc..a.b..ac.b..a";

function Line({ w, dark = false }: { w: 16 | 30 | 40 | 50 | 60 | 70 | 80; dark?: boolean }) {
  return <span className="sk" data-w={w} data-dark={dark ? "" : undefined} />;
}

function Skeleton({ layout }: { layout: ScreenLayout }) {
  switch (layout) {
    case "agenda":
      return (
        <div className="grid-cells">
          {[...AGENDA].map((c, i) => (
            <span key={i} data-c={c === "." ? undefined : c} />
          ))}
        </div>
      );
    case "record":
      return (
        <div className="ui-split">
          <div className="ui-side">
            <Line w={80} dark />
            <Line w={60} />
            <Line w={70} />
            <Line w={50} />
          </div>
          <div className="ui-stack">
            <Line w={60} dark />
            <Line w={40} />
            <div className="tiles-row">
              <span />
              <span data-c="a" />
              <span />
              <span />
            </div>
            <Line w={80} />
            <Line w={70} />
          </div>
        </div>
      );
    case "plan":
      return (
        <div className="ui-list">
          <Line w={50} dark />
          <Line w={80} />
          <Line w={70} />
          <Line w={60} />
          <Line w={80} />
          <Line w={40} />
        </div>
      );
    case "invoice":
      return (
        <div className="ui-list">
          <div className="ui-row">
            <Line w={40} dark />
            <Line w={16} />
          </div>
          <Line w={70} />
          <Line w={60} />
          <Line w={70} />
          <span className="ui-total" />
        </div>
      );
  }
}

export function Screen(props: ScreenProps) {
  const { aspect = "default", caption, captionHidden = false, className } = props;
  const screen = (
    <div className={cn("screen", caption === undefined && className)} data-aspect={aspect}>
      {props.src === undefined ? (
        <div
          className="screen-inner"
          data-media-inner=""
          data-placeholder="screen"
          role="img"
          aria-label={props.label}
        >
          <div className="ui-bar">
            <i />
            <i />
            <i />
          </div>
          <div className="ui-body">
            <Skeleton layout={props.layout} />
          </div>
        </div>
      ) : (
        <div className="screen-inner" data-media-inner="" data-image="">
          <Image
            className="screen-image"
            src={props.src}
            alt={props.alt}
            width={props.width}
            height={props.height}
            sizes={props.sizes}
            priority={props.priority}
          />
        </div>
      )}
    </div>
  );
  if (caption === undefined) return screen;
  return (
    <figure className={cn("screen-figure", className)}>
      {screen}
      <figcaption className={captionHidden ? "sr" : "screen-caption"}>{caption}</figcaption>
    </figure>
  );
}
