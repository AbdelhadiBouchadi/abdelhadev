/* MediaReveal and the stage timelines zoom [data-media-inner] while the frame around it opens. */
import Image, { type StaticImageData } from "next/image";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ScreenLayout =
  "agenda" | "record" | "plan" | "invoice" | "list" | "chart" | "chat" | "site";
export type ScreenAspect = "default" | "tall" | "wide";

interface ScreenCommon {
  /** default 16 / 10, tall 4 / 5, wide 21 / 10. */
  aspect?: ScreenAspect;
  caption?: ReactNode;
  /** Caption for assistive technology only. */
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
  media?: never;
  layout?: never;
  label?: never;
}

export interface ScreenMediaProps extends ScreenCommon {
  media: ReactElement;
  src?: never;
  layout?: never;
  label?: never;
}

export interface ScreenPlaceholderProps extends ScreenCommon {
  media?: never;
  src?: never;
  layout: ScreenLayout;
  label: string;
}

export type ScreenProps = ScreenImageProps | ScreenMediaProps | ScreenPlaceholderProps;

const AGENDA = "a.b.c.a..bc..a.b..ac.b..a";
/** Heights in ui.css; the fifth bar is Majorelle. */
const BARS = "....b.";

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
    case "list":
      return (
        <>
          <div className="tiles-row">
            <span data-c="a" />
            <span />
            <span />
            <span data-c="a" />
          </div>
          <div className="ui-list ui-list-tight">
            <Line w={50} dark />
            <Line w={30} />
          </div>
        </>
      );
    case "chart":
      return (
        <div className="ui-list ui-list-loose">
          <Line w={40} dark />
          <div className="bars">
            {[...BARS].map((c, i) => (
              <span key={i} data-c={c === "." ? undefined : c} />
            ))}
          </div>
        </div>
      );
    case "chat":
      return (
        <div className="bubbles">
          <span />
          <span data-me="" />
          <span data-w="54" />
          <span data-me="" data-w="36" />
        </div>
      );
    case "site":
      return (
        <div className="ui-list">
          <span className="ui-hero" />
          <Line w={60} dark />
          <Line w={80} />
          <Line w={50} />
        </div>
      );
  }
}

export function Screen(props: ScreenProps) {
  const { aspect = "default", caption, captionHidden = false, className } = props;
  const screen = (
    <div className={cn("screen", caption === undefined && className)} data-aspect={aspect}>
      {props.media !== undefined ? (
        <div className="screen-inner" data-media-inner="" data-image="" data-media="">
          {props.media}
        </div>
      ) : props.src === undefined ? (
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
