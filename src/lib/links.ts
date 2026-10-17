/* Which clicks the route curtain takes over (prototype: the navigation click handler in site.js).
   Pure, so the rules are unit tested. */

export interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}

export interface AnchorLike {
  /** The raw href attribute. */
  href: string;
  target?: string;
  download?: boolean;
}

/** A click the browser should handle itself: another button, or a modifier (new tab, window,
    download). */
export function isModifiedClick(e: ClickLike): boolean {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

/** Another origin or another scheme: http(s), mailto:, tel:, protocol-relative. */
export function isExternalHref(href: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

/** True when the curtain should handle this click instead of the browser. */
export function shouldTransition(e: ClickLike, anchor: AnchorLike): boolean {
  if (e.defaultPrevented || isModifiedClick(e)) return false;
  if (anchor.download) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  return !isExternalHref(anchor.href);
}

/** Splits "/fr/projets#dentaflow" into its path and hash (without "#"). */
export function splitHash(url: string): { path: string; hash: string } {
  const at = url.indexOf("#");
  return at === -1 ? { path: url, hash: "" } : { path: url.slice(0, at), hash: url.slice(at + 1) };
}

/** Compares two paths, ignoring a trailing slash and percent-encoding. */
export function isSamePath(a: string, b: string): boolean {
  const norm = (p: string) => {
    let decoded = p;
    try {
      decoded = decodeURI(p);
    } catch {
      // A malformed escape: compare the raw string.
    }
    return decoded.length > 1 ? decoded.replace(/\/+$/, "") : decoded;
  };
  return norm(a) === norm(b);
}
