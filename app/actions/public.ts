"use server";

import { createServiceClient } from "@/lib/supabase/service";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
  values?: { name: string; email: string; message: string };
};

const getText = (formData: FormData, key: string, maxLength: number) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength + 1) : "";
};

export async function submitContactMessage(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = getText(formData, "name", 80);
  const email = getText(formData, "email", 254).toLowerCase();
  const message = getText(formData, "message", 4000);
  const website = getText(formData, "website", 200);
  const values = { name, email, message };
  const fieldErrors: ContactFormState["fieldErrors"] = {};

  if (name.length < 2 || name.length > 80) fieldErrors.name = "Enter a name between 2 and 80 characters.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (message.length < 10 || message.length > 4000) fieldErrors.message = "Tell us a little more (10–4,000 characters).";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please check the highlighted fields and try again.", fieldErrors, values };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { status: "error", message: "Our contact service is temporarily unavailable. Please email info@liongoldss.com.", values };
  }

  try {
    const { error } = await supabase.rpc("submit_contact_message", {
      p_name: name,
      p_email: email,
      p_message: message,
      p_website: website,
    });

    if (error) {
      console.error("Contact submission failed:", error.message);
      return { status: "error", message: "We could not send your message just now. Please try again shortly.", values };
    }

    return { status: "success", message: "Thank you — your message is on its way to our team." };
  } catch (error) {
    console.error("Contact service unavailable:", error instanceof Error ? error.message : "Unknown error");
    return { status: "error", message: "Our contact service is temporarily unavailable. Please email info@liongoldss.com.", values };
  }
}
