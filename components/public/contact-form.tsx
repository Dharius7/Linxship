"use client";

import { submitContactMessage, type ContactFormState } from "@/app/actions/public";
import { ArrowRight, CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

const initialState: ContactFormState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="contact-form__submit" type="submit" disabled={pending}>
      <span>{pending ? "Sending message…" : "Send message"}</span>
      {pending ? <LoaderCircle className="spin" aria-hidden="true" size={19} /> : <ArrowRight aria-hidden="true" size={19} />}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} className="contact-form" action={formAction} noValidate>
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="contact-form__row">
        <div className="contact-form__group">
          <label htmlFor="contact-name">Your name</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            minLength={2}
            maxLength={80}
            autoComplete="name"
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={state.fieldErrors?.name ? "contact-name-error" : undefined}
            placeholder="Jane Smith"
            defaultValue={state.values?.name}
            required
          />
          {state.fieldErrors?.name && <span id="contact-name-error">{state.fieldErrors.name}</span>}
        </div>
        <div className="contact-form__group">
          <label htmlFor="contact-email">Email address</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "contact-email-error" : undefined}
            placeholder="jane@company.com"
            defaultValue={state.values?.email}
            required
          />
          {state.fieldErrors?.email && <span id="contact-email-error">{state.fieldErrors.email}</span>}
        </div>
      </div>

      <div className="contact-form__group">
        <label htmlFor="contact-message">How can we help?</label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          minLength={10}
          maxLength={4000}
          aria-invalid={Boolean(state.fieldErrors?.message)}
          aria-describedby={state.fieldErrors?.message ? "contact-message-error" : undefined}
          placeholder="Tell us about your route, cargo, or delivery timeline."
          defaultValue={state.values?.message}
          required
        />
        {state.fieldErrors?.message && <span id="contact-message-error">{state.fieldErrors.message}</span>}
      </div>

      <div className="contact-form__footer">
        <p>We usually reply within one business day.</p>
        <SubmitButton />
      </div>

      {state.status !== "idle" && (
        <div className={`contact-form__status is-${state.status}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">
          {state.status === "success" ? <CheckCircle2 aria-hidden="true" size={19} /> : <TriangleAlert aria-hidden="true" size={19} />}
          <span>{state.message}</span>
        </div>
      )}
    </form>
  );
}
