"use client";

/* The content under the overlay is inert while it is up (lib/shell.ts). One panel serves the
   first visit, the curtain on leave (`cover`) and the short loader on arrival (`run`). */
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { AnimatedMark } from "@/components/brand/AnimatedMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { markVisited } from "@/lib/loader";
import {
  CURTAIN_AT,
  DURATION,
  EASE,
  LOADER,
  LOADER_EXIT_AT,
  LOADER_MOVE,
  MEDIA,
  STAGGER,
  SUN,
} from "@/lib/motion";
import {
  detectKind,
  fireReady,
  setContentInert,
  setOverlay,
  shellBusy,
  shellRegistry,
  type Overlay,
} from "@/lib/shell";
import { placeName } from "@/lib/site";
import { useSmoothScroll } from "@/primitives/SmoothScroll";

/** StrictMode runs the effect twice in development, so the tasks are tracked once. */
let booted = false;
let tasksTracked = false;

interface ActiveRun {
  boot: boolean;
  /** Stops listening without settling: the next mount restarts the cycle. */
  cancel: () => void;
  settle: () => void;
}

function windowLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", () => resolve(), { once: true });
  });
}

function hashTarget(): HTMLElement | null {
  if (!location.hash) return null;
  try {
    return document.getElementById(decodeURIComponent(location.hash.slice(1)));
  } catch {
    return null;
  }
}

export function Loader() {
  const t = useTranslations("loader");
  const locale = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();

  // The content under the overlay is inert exactly while the shell is busy. Also on bfcache
  // restore: a page frozen mid-curtain comes back usable.
  useIsomorphicLayoutEffect(() => {
    setContentInert(document, shellBusy.get());
    const off = shellBusy.subscribe((busy) => {
      setContentInert(document, busy);
    });
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      document.documentElement.classList.add("loader-off");
      shellBusy.set(false);
      setContentInert(document, false);
      fireReady();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      off();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = <T extends Element>(selector: string) => el.querySelector<T>(selector);
      const panel = q<HTMLElement>("[data-loader-panel]");
      const mark = q<SVGSVGElement>("[data-loader-mark] svg");
      const disc = q<SVGCircleElement>("[data-sun-disc]");
      const horizon = q<SVGRectElement>("[data-horizon]");
      const reflection = q<SVGRectElement>("[data-reflection]");
      const meta = q<HTMLElement>("[data-loader-meta]");
      const count = q<HTMLElement>("[data-loader-count]");
      const bar = q<HTMLElement>("[data-loader-bar]");
      const live = q<HTMLElement>("[data-loader-live]");
      const glyphs = gsap.utils.toArray<SVGPathElement>(el.querySelectorAll("[data-letter]"));
      if (!panel || !mark || !disc || !horizon || !reflection || !meta || !count || !bar || !live)
        return;
      const html = document.documentElement;

      const mm = gsap.matchMedia();
      mm.add({ motion: MEDIA.motion, reduce: MEDIA.reduce }, (context) => {
        const reduce = Boolean(context.conditions?.reduce);
        const setDisc = gsap.quickSetter(disc, "y", "px");
        const setBar = gsap.quickSetter(bar, "scaleX");
        const shown = { v: 0 };
        let target = 0;
        let lit = 0;
        let announced = 0;
        let running: gsap.core.Animation[] = [];
        let active: ActiveRun | null = null;

        const stop = () => {
          for (const a of running) a.kill();
          running = [];
        };
        const keep = <A extends gsap.core.Animation>(a: A): A => {
          running.push(a);
          return a;
        };

        const paint = () => {
          const v = shown.v;
          const pct = Math.round(v * 100);
          count.textContent = String(pct).padStart(3, "0");
          setBar(v);
          if (!reduce) setDisc(SUN.setY * (1 - v));
          const due = Math.floor(v * glyphs.length + 0.0001);
          if (lit < due) {
            context.add(() => {
              while (lit < due && lit < glyphs.length) {
                gsap.to(glyphs[lit] ?? [], {
                  opacity: 1,
                  y: 0,
                  duration: reduce ? DURATION.instant : DURATION.letter,
                });
                lit++;
              }
            });
          }
          if (pct >= announced + 50) {
            announced = pct >= 100 ? 100 : 50;
            live.textContent = t("status", { percent: announced });
          }
        };

        const resetMeter = () => {
          shown.v = 0;
          target = 0;
          lit = 0;
          announced = 0;
          count.textContent = "000";
          setBar(0);
        };

        const show = () => {
          html.classList.remove("loader-off");
          gsap.set(el, { opacity: 1 });
        };

        const finish = () => {
          html.classList.add("loader-off");
          shellBusy.set(false);
          // Needed even after an arrival's own refresh: Lenis starting gives the scrollbar back
          // (`.lenis-stopped` hides it), which narrows the page on classic-scrollbar systems.
          ScrollTrigger.refresh();
        };

        const setCovered = (sunY: number) => {
          gsap.set(panel, {
            yPercent: 0,
            borderRadius: 0,
          });
          gsap.set(mark, { y: 0, opacity: 1 });
          gsap.set(glyphs, { opacity: 0 });
          gsap.set(meta, { opacity: 0 });
          resetMeter();
          setDisc(sunY);
        };

        const tweenTo = (progress: number, duration: number) => {
          if (progress <= target) return;
          target = progress;
          context.add(() => {
            keep(
              gsap.to(shown, {
                v: progress,
                duration: reduce ? DURATION.instant : duration,
                ease: EASE.progress,
                overwrite: true,
                onUpdate: paint,
              }),
            );
          });
        };

        const exit = (
          run: ActiveRun,
          { beforeExit, afterExit }: { beforeExit?: () => void; afterExit?: () => void },
          resolve: () => void,
        ) => {
          markVisited();
          beforeExit?.();
          const done = () => {
            if (active === run) active = null;
            finish();
            afterExit?.();
            resolve();
          };
          if (reduce) {
            keep(gsap.to(el, { opacity: 0, duration: DURATION.reducedFade, onComplete: done }));
            fireReady();
            return;
          }
          keep(
            gsap
              .timeline({ onComplete: done })
              .to(
                glyphs,
                {
                  y: LOADER_MOVE.letterOutY,
                  opacity: 0,
                  duration: DURATION.lettersOut,
                  stagger: STAGGER.lettersOut,
                  ease: EASE.liftOut,
                },
                0,
              )
              .to(
                mark,
                {
                  y: LOADER_MOVE.markOutY,
                  opacity: 0,
                  duration: DURATION.markOut,
                  ease: EASE.liftOut,
                },
                LOADER_EXIT_AT.mark,
              )
              .to(meta, { opacity: 0, duration: DURATION.metaOut }, 0)
              .to(
                panel,
                {
                  yPercent: -100,
                  borderBottomLeftRadius: LOADER_MOVE.curve,
                  borderBottomRightRadius: LOADER_MOVE.curve,
                  duration: DURATION.panelOut,
                  ease: EASE.warm,
                },
                LOADER_EXIT_AT.panel,
              )
              .add(() => {
                fireReady();
              }, LOADER_EXIT_AT.ready),
          );
        };

        const overlay: Overlay = {
          cover: () =>
            new Promise<void>((resolve) => {
              context.add(() => {
                stop();
                show();
                setCovered(0);
                if (reduce) {
                  resolve();
                  return;
                }
                gsap.set(panel, {
                  yPercent: 100,
                  borderTopLeftRadius: LOADER_MOVE.curve,
                  borderTopRightRadius: LOADER_MOVE.curve,
                });
                keep(
                  gsap
                    .timeline({ onComplete: resolve })
                    .to(
                      panel,
                      {
                        yPercent: 0,
                        borderTopLeftRadius: LOADER_MOVE.flat,
                        borderTopRightRadius: LOADER_MOVE.flat,
                        duration: DURATION.curtain,
                        ease: EASE.warm,
                      },
                      0,
                    )
                    .to(
                      disc,
                      { y: SUN.setY, duration: DURATION.sunset, ease: EASE.sunset },
                      CURTAIN_AT.sun,
                    ),
                );
              });
            }),

          coverNow: () => {
            context.add(() => {
              stop();
              show();
              setCovered(reduce ? 0 : SUN.setY);
            });
          },

          run: ({ beforeExit, afterExit, drawIn = false } = {}) =>
            new Promise<void>((resolve) => {
              const registry = shellRegistry();
              active?.cancel();
              context.add(() => {
                stop();
                show();
                shellBusy.set(true);
                gsap.set(panel, { yPercent: 0 });
                gsap.set(mark, { y: 0, opacity: 1 });
                keep(
                  gsap.to(meta, {
                    opacity: 1,
                    duration: reduce ? DURATION.instant : DURATION.metaOut,
                  }),
                );
                gsap.set(
                  glyphs,
                  reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: LOADER_MOVE.letterY },
                );
                resetMeter();
                setDisc(reduce ? 0 : SUN.setY);
                if (drawIn && !reduce) {
                  keep(
                    gsap.from([horizon, reflection], {
                      scaleX: 0,
                      svgOrigin: LOADER_MOVE.horizonOrigin,
                      duration: DURATION.horizon,
                      stagger: STAGGER.horizon,
                    }),
                  );
                }
              });
              const off = registry.subscribe((p) => {
                tweenTo(p, DURATION.progress);
              });
              tweenTo(registry.progress(), DURATION.progress);
              const run: ActiveRun = {
                boot: !booted,
                cancel: off,
                settle: () => {
                  off();
                  finish();
                  fireReady();
                  resolve();
                },
              };
              active = run;
              void registry.whenReady().then(() => {
                off();
                if (active !== run) return;
                target = 1;
                context.add(() => {
                  keep(
                    gsap.to(shown, {
                      v: 1,
                      duration: reduce ? DURATION.instant : DURATION.progressEnd,
                      ease: EASE.progress,
                      overwrite: true,
                      onUpdate: paint,
                      onComplete: () => {
                        context.add(() => {
                          exit(run, { beforeExit, afterExit }, resolve);
                        });
                      },
                    }),
                  );
                });
              });
            }),
        };

        const unregister = setOverlay(overlay);

        if (!booted) {
          const registry = shellRegistry();
          if (!tasksTracked) {
            tasksTracked = true;
            registry.track(LOADER.weights.fonts, document.fonts.ready);
            registry.track(LOADER.weights.load, windowLoaded());
            for (const img of document.querySelectorAll<HTMLImageElement>("img[data-critical]")) {
              registry.track(LOADER.weights.image, img.decode());
            }
          }
          void overlay.run({
            drawIn: detectKind() === "first",
            beforeExit: () => {
              const target = hashTarget();
              if (target) scrollTo(target, { immediate: true });
            },
          });
          booted = true;
        }

        return () => {
          unregister();
          stop();
          const run = active;
          active = null;
          if (!run) return;
          if (run.boot) {
            // StrictMode's simulated unmount, or a motion preference change: the next mount (or
            // the other matchMedia branch) starts the page-load cycle again on the same registry.
            run.cancel();
            booted = false;
          } else {
            // A route arrival cut short: never leave the page covered and inert.
            run.settle();
          }
        };
      });

      return () => {
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="loader" data-loader>
      <div className="loader-panel" data-loader-panel>
        <div className="loader-glow" aria-hidden="true" />
        <div className="loader-center" aria-hidden="true">
          <span className="loader-mark" data-loader-mark>
            <AnimatedMark className="block h-auto w-full" />
          </span>
          <Wordmark decorative className="loader-word" />
        </div>
        <div className="loader-meta" data-loader-meta aria-hidden="true">
          <span className="loader-count" data-loader-count>
            000
          </span>
          <span>{placeName(locale)}</span>
        </div>
        <span className="loader-bar" data-loader-bar aria-hidden="true" />
        <span className="sr" role="status" aria-live="polite" data-loader-live>
          {t("loading")}
        </span>
      </div>
    </div>
  );
}
