"use client";

/* The server renders every state, so the form works as a native post without JavaScript. On
   success the form stays mounted but hidden, so the WhatsApp card's listener and the action's
   reset keep their element. The toast only repeats the outcome and never moves focus. */
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { toast, Toaster } from "sonner";
import { sendContact } from "@/actions/contact";
import { buttonClass, buttonGhost, SunDot } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import {
  firstInvalid,
  INITIAL_CONTACT_STATE,
  LIMITS,
  readContactForm,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactState,
  type Topic,
} from "@/lib/contact-schema";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CONTACT, EASE, MEDIA } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/primitives/Magnetic";

export interface ContactFormCopy {
  labels: Record<ContactField, string>;
  errors: Record<ContactField, string>;
  topics: { key: Topic; label: string }[];
  topicPlaceholder: string;
  hint: string;
  honeypot: string;
  privacy: string;
  submit: string;
  sending: string;
  success: { title: string; text: string; again: string };
  failed: { send: string; rateLimit: string };
  toast: { region: string; close: string; sent: string; failed: string; rateLimit: string };
  cursor: string;
}

export interface ContactFormProps {
  id: string;
  copy: ContactFormCopy;
  locale: Locale;
  /** "Write another message" without JavaScript. */
  againHref: string;
}

const fieldId = (field: ContactField) => `f-${field}`;
const errorId = (field: ContactField) => `e-${field}`;
const HINT_ID = "h-message";

export function ContactForm({ id, copy, locale, againHref }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(sendContact, INITIAL_CONTACT_STATE);
  /** null once a post goes out. */
  const [clientErrors, setClientErrors] = useState<ContactErrors | null>(null);
  const [dismissed, setDismissed] = useState<ContactState | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const doneTitle = useRef<HTMLHeadingElement>(null);
  /** Only later states move focus or animate. */
  const first = useRef(state);
  const desktop = useMediaQuery(MEDIA.desktop);
  const toastOffset = desktop ? CONTACT.toast.offset : CONTACT.toast.mobileOffset;

  const isDone = state.status === "sent" && dismissed !== state;
  const errors: ContactErrors = clientErrors ?? (state.status === "invalid" ? state.errors : {});
  const values = state.status === "invalid" || state.status === "failed" ? state.values : undefined;

  const focusField = (field: ContactField | undefined) => {
    if (field) form.current?.querySelector<HTMLElement>(`#${fieldId(field)}`)?.focus();
  };

  // A new state from the server: focus its first invalid field, or the confirmation heading.
  useEffect(() => {
    if (state === first.current) return;
    if (state.status === "invalid") focusField(firstInvalid(state.errors));
    if (state.status === "sent") doneTitle.current?.focus();
  }, [state]);

  // Once per state, never for the state the page was rendered with.
  const toasted = useRef(state);
  useEffect(() => {
    if (state === toasted.current) return;
    toasted.current = state;
    if (state.status === "sent") {
      toast.success(copy.toast.sent, { description: copy.success.text });
    } else if (state.status === "failed") {
      toast.error(state.reason === "rateLimit" ? copy.toast.rateLimit : copy.toast.failed, {
        description: copy.failed[state.reason],
      });
    }
  }, [state, copy]);

  // The page below moved, so ScrollTrigger measures again.
  useGSAP(
    () => {
      if (state === first.current && dismissed === null) return;
      const mm = gsap.matchMedia();
      if (isDone && done.current) {
        const el = done.current;
        mm.add(MEDIA.motion, () => {
          gsap.fromTo(
            el,
            { y: CONTACT.done.y, opacity: 0 },
            { y: 0, opacity: 1, duration: CONTACT.done.duration, ease: EASE.warm },
          );
        });
      }
      ScrollTrigger.refresh();
      return () => {
        mm.revert();
      };
    },
    { dependencies: [isDone], scope: root, revertOnUpdate: true },
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const input = readContactForm(new FormData(event.currentTarget));
    // A filled honeypot goes to the server, which answers as if sent.
    if (input.company !== "") return;
    const checked = validateContact(input);
    const field = checked.ok ? undefined : firstInvalid(checked.errors);
    if (!checked.ok && field) {
      event.preventDefault();
      setClientErrors(checked.errors);
      focusField(field);
      return;
    }
    setClientErrors(null);
  };

  const writeAgain = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setDismissed(state);
    setClientErrors(null);
    form.current?.reset();
    // The form is shown on the next render; focus it then.
    requestAnimationFrame(() => {
      focusField("name");
    });
  };

  const describedBy = (field: ContactField, hint?: string) =>
    [hint, errors[field] ? errorId(field) : undefined].filter(Boolean).join(" ") || undefined;

  const control = (field: ContactField, hint?: string) => ({
    id: fieldId(field),
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": describedBy(field, hint),
  });

  const error = (field: ContactField) =>
    errors[field] ? (
      <span className="error" id={errorId(field)}>
        {copy.errors[field]}
      </span>
    ) : null;

  const fieldClass = (field: ContactField) => cn("field", errors[field] && "has-error");

  return (
    <div ref={root}>
      <form
        ref={form}
        id={id}
        action={formAction}
        onSubmit={onSubmit}
        noValidate
        hidden={isDone}
        aria-busy={pending}
        className="form"
      >
        <input type="hidden" name="locale" value={locale} />
        <div className="form-row">
          <div className={fieldClass("name")}>
            <label htmlFor={fieldId("name")}>{copy.labels.name}</label>
            <input
              {...control("name")}
              autoComplete="name"
              maxLength={LIMITS.name.max}
              defaultValue={values?.name}
            />
            {error("name")}
          </div>
          <div className={fieldClass("email")}>
            <label htmlFor={fieldId("email")}>{copy.labels.email}</label>
            <input
              {...control("email")}
              type="email"
              autoComplete="email"
              maxLength={LIMITS.email.max}
              defaultValue={values?.email}
            />
            {error("email")}
          </div>
        </div>
        <div className={fieldClass("topic")}>
          <label htmlFor={fieldId("topic")}>{copy.labels.topic}</label>
          <select {...control("topic")} defaultValue={values?.topic ?? ""}>
            <option value="">{copy.topicPlaceholder}</option>
            {copy.topics.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {error("topic")}
        </div>
        <div className={fieldClass("message")}>
          <label htmlFor={fieldId("message")}>{copy.labels.message}</label>
          <textarea
            {...control("message", HINT_ID)}
            maxLength={LIMITS.message.max}
            defaultValue={values?.message}
          />
          <span className="hint" id={HINT_ID}>
            {copy.hint}
          </span>
          {error("message")}
        </div>
        <div className="hp" aria-hidden="true">
          <label htmlFor="f-company">{copy.honeypot}</label>
          <input id="f-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
        {state.status === "failed" ? (
          <p className="form-failed" role="alert">
            {copy.failed[state.reason]}
          </p>
        ) : null}
        <div className="form-foot">
          <p>{copy.privacy}</p>
          <Magnetic>
            <button
              type="submit"
              disabled={pending}
              data-cursor={copy.cursor}
              className={cn(buttonClass, "disabled:cursor-wait disabled:opacity-70")}
            >
              <SunDot />
              {pending ? copy.sending : copy.submit}
            </button>
          </Magnetic>
        </div>
      </form>
      <div ref={done} className="form-done" hidden={!isDone}>
        <h3 ref={doneTitle} tabIndex={-1} className="display h-sm outline-none">
          {copy.success.title}
        </h3>
        <p>{copy.success.text}</p>
        <div>
          <a href={againHref} onClick={writeAgain} className={cn(buttonClass, buttonGhost)}>
            {copy.success.again}
          </a>
        </div>
      </div>
      {/* Mounted here only, so no other page ships it. */}
      <Toaster
        position={desktop ? "bottom-right" : "bottom-center"}
        offset={toastOffset}
        mobileOffset={toastOffset}
        duration={CONTACT.toast.durationMs}
        containerAriaLabel={copy.toast.region}
        closeButton
        toastOptions={{
          unstyled: true,
          closeButtonAriaLabel: copy.toast.close,
          classNames: {
            toast: "contact-toast",
            title: "contact-toast-title",
            description: "contact-toast-text",
            closeButton: "contact-toast-close",
            icon: "contact-toast-icon",
          },
        }}
      />
    </div>
  );
}
