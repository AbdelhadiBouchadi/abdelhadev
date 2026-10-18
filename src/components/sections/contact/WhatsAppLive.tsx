"use client";

/* The WhatsApp card's live part (prototype initForms → compose): the preview and the button.
   It listens to the form (by id, delegated from the document, so it survives the form being
   hidden, reset or re-rendered) and rebuilds the message and the wa.me link on every input, in the
   page language (src/lib/whatsapp.ts). The preview is a polite live region.

   Server-rendered with the greeting and the bare wa.me link, so without JavaScript the button
   opens WhatsApp on the number with no text. */
import { useEffect, useState } from "react";
import { buttonClass, SunDot } from "@/components/ui/Button";
import { composeWhatsApp, whatsAppHref, type WhatsAppCopy } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export interface WhatsAppLiveProps {
  formId: string;
  copy: WhatsAppCopy;
  /** The wa.me link to the number (src/lib/site.ts). */
  base: string;
  /** The topic labels by key, as the form shows them. */
  topics: Record<string, string>;
  action: string;
  previewLabel: string;
  /** "opens in a new tab", read after the button's text. */
  newTab: string;
  cursor: string;
}

const read = (form: HTMLFormElement, name: string) => {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value : "";
};

export function WhatsAppLive({
  formId,
  copy,
  base,
  topics,
  action,
  previewLabel,
  newTab,
  cursor,
}: WhatsAppLiveProps) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const compose = () => {
      const form = document.getElementById(formId);
      if (!(form instanceof HTMLFormElement)) return;
      setText(
        composeWhatsApp(copy, {
          name: read(form, "name"),
          topic: topics[read(form, "topic")],
          message: read(form, "message"),
        }),
      );
    };
    const onEvent = (event: Event) => {
      const target = event.target;
      const form =
        target instanceof HTMLFormElement
          ? target
          : target instanceof HTMLElement
            ? target.closest("form")
            : null;
      if (form?.id !== formId) return;
      // `reset` fires before the fields are reset: read them once it has happened.
      if (event.type === "reset") setTimeout(compose, 0);
      else compose();
    };
    compose();
    for (const type of ["input", "change", "reset"]) document.addEventListener(type, onEvent);
    return () => {
      for (const type of ["input", "change", "reset"]) document.removeEventListener(type, onEvent);
    };
  }, [formId, copy, topics]);

  const message = text ?? copy.greeting;
  return (
    <>
      <div className="wa-preview" role="status" aria-live="polite" aria-label={previewLabel}>
        {message}
      </div>
      <div>
        <a
          className={cn(buttonClass)}
          href={whatsAppHref(base, text ?? undefined)}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor={cursor}
        >
          <SunDot />
          {action}
          <span className="sr"> ({newTab})</span>
        </a>
      </div>
    </>
  );
}
