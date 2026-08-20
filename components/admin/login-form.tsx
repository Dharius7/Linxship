"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, type AdminActionState } from "@/lib/actions/admin";
import { ActionAlert, SubmitButton } from "./ui";

const initialState: AdminActionState = { status: "idle", message: "" };

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  useEffect(() => {
    if (state.status !== "error") return;
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) window.requestAnimationFrame(() => document.getElementById(firstField)?.focus());
  }, [state.fieldErrors, state.status]);

  return (
    <form action={action} className="admin-login-form" noValidate>
      <ActionAlert state={state} />
      <div className="admin-field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" autoFocus required aria-invalid={Boolean(state.fieldErrors?.email) || undefined} aria-describedby={state.fieldErrors?.email ? "email-error" : undefined} />
        {state.fieldErrors?.email && <small className="admin-field-error" id="email-error">{state.fieldErrors.email}</small>}
      </div>
      <div className="admin-field">
        <div className="admin-label-row"><label htmlFor="password">Password</label><span>Secure administrator access</span></div>
        <input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={Boolean(state.fieldErrors?.password) || undefined} aria-describedby={state.fieldErrors?.password ? "password-error" : undefined} />
        {state.fieldErrors?.password && <small className="admin-field-error" id="password-error">{state.fieldErrors.password}</small>}
      </div>
      <SubmitButton pendingLabel="Signing in…" className="admin-button admin-button--wide">Sign in to dashboard</SubmitButton>
    </form>
  );
}
