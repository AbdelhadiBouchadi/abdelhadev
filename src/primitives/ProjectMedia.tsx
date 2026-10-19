/* `pnpm media` already optimised the files, so they skip next/image. A video always has a
   play/pause button (WCAG 2.2.2); without JavaScript its poster shows. */
import type { CSSProperties } from "react";
import { largest, srcSet, type ProjectMediaItem } from "@/lib/media";
import { VideoLoopControl } from "@/primitives/VideoLoopControl";

export interface ProjectMediaProps {
  item: ProjectMediaItem;
  alt: string;
  /** Required for a video. */
  label?: string;
  sizes: string;
  priority?: boolean;
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
