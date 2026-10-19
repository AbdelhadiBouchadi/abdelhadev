/* One real screen from the media manifest (08b), server-rendered, to place inside a Screen frame
   (its `media` slot). The files are already optimised by `pnpm media`, so they are not run
   through next/image again.
   - Image: <picture> with AVIF then WebP, srcset and sizes, the intrinsic width and height (no
     layout shift), the blur placeholder as the image's background until it has loaded. Lazy
     unless `priority` (the first screen of the first project in view).
   - Video: <video muted loop playsinline preload="none"> with WebM then MP4 and the poster, named
     by `label`; without JavaScript the poster shows. VideoLoopControl (the client leaf) plays it
     while at least half of it is visible, pauses it otherwise, never autoplays under reduced
     motion, and is the always-present play/pause button (WCAG 2.2.2). */
import type { CSSProperties } from "react";
import { largest, srcSet, type ProjectMediaItem } from "@/lib/media";
import { VideoLoopControl } from "@/primitives/VideoLoopControl";

export interface ProjectMediaProps {
  item: ProjectMediaItem;
  alt: string;
  /** The video's accessible name (messages <key>.label); required for a video. */
  label?: string;
  /** The image's `sizes`, from the layout of the frame. */
  sizes: string;
  priority?: boolean;
  /** The play/pause button's names (messages work.video). */
  controls: { play: string; pause: string };
}

const blurBehind = (dataUri: string): CSSProperties => ({ backgroundImage: `url("${dataUri}")` });

export function ProjectMedia({
  item,
  alt,
  label,
  sizes,
  priority = false,
  controls,
}: ProjectMediaProps) {
  const { asset } = item;

  if (asset.kind === "image") {
    const fallback = largest(asset.webp);
    return (
      <picture className="media-picture">
        <source type="image/avif" srcSet={srcSet(asset.avif)} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(asset.webp)} sizes={sizes} />
        <img
          className="media-img"
          src={fallback?.src}
          alt={alt}
          width={asset.width}
          height={asset.height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "auto" : "async"}
          fetchPriority={priority ? "high" : undefined}
          style={blurBehind(asset.blur)}
        />
      </picture>
    );
  }

  if (label === undefined) throw new Error(`messages: ${item.key}.label is missing (a video)`);
  return (
    <div className="media-video" data-video-loop="">
      <video
        className="media-img"
        muted
        loop
        playsInline
        preload="none"
        poster={asset.poster.webp.src}
        width={asset.width}
        height={asset.height}
        aria-label={label}
        style={blurBehind(asset.poster.blur)}
      >
        <source src={asset.webm.src} type="video/webm" />
        <source src={asset.mp4.src} type="video/mp4" />
      </video>
      <VideoLoopControl play={controls.play} pause={controls.pause} />
    </div>
  );
}
