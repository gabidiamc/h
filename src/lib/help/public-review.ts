/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Voluntary public review (Trustpilot) support.
 *
 * There is no Trustpilot API, no AFS, no BCC address and no email service here:
 * a staff member pastes the official "write a review" link, verifies it by hand
 * and the site shows a plain external button. Nothing internal is ever sent to
 * Trustpilot — only an anonymous click event is stored locally.
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { fetchHelpSettings } from "./data";

const db = (name: string) => (supabase as any).from(name);

export const REVIEW_KEYS = {
  enabled: "PUBLIC_REVIEW_ENABLED",
  provider: "PUBLIC_REVIEW_PROVIDER",
  url: "PUBLIC_REVIEW_URL",
  verifiedAt: "PUBLIC_REVIEW_VERIFIED_AT",
} as const;

export const ALLOWED_REVIEW_HOSTS = ["trustpilot.com", "www.trustpilot.com"];

export type ReviewUrlProblem = "missing" | "insecure" | "not_trustpilot";

export type ReviewUrlCheck = { ok: true; url: string } | { ok: false; problem: ReviewUrlProblem };

/**
 * Accepts only https links on trustpilot.com / www.trustpilot.com.
 * Rejects mailto:, javascript:, plain http and look-alike domains.
 */
export function checkReviewUrl(raw: string | null | undefined): ReviewUrlCheck {
  const value = (raw ?? "").trim();
  if (!value) return { ok: false, problem: "missing" };
  if (/^(mailto|javascript|data|vbscript):/i.test(value)) {
    return { ok: false, problem: "not_trustpilot" };
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, problem: "not_trustpilot" };
  }
  if (parsed.protocol !== "https:") return { ok: false, problem: "insecure" };
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_REVIEW_HOSTS.includes(host)) return { ok: false, problem: "not_trustpilot" };
  return { ok: true, url: parsed.toString() };
}

export const REVIEW_MESSAGES: Record<ReviewUrlProblem | "disabled", string> = {
  disabled:
    "Las reseñas públicas todavía no están disponibles. Puedes compartir tu opinión directamente con nosotros.",
  missing: "El enlace de Trustpilot todavía no ha sido configurado.",
  not_trustpilot: "No se pudo verificar el destino del enlace.",
  insecure: "No se pudo verificar el destino del enlace.",
};

export type PublicReviewState = {
  enabled: boolean;
  provider: string;
  rawUrl: string;
  verifiedAt: string;
  /** Safe link to use, or null when it cannot be trusted. */
  url: string | null;
  /** Message to show families when the button is not available. */
  unavailableMessage: string | null;
};

export function readPublicReviewState(
  settings: Record<string, string> | undefined,
): PublicReviewState {
  const enabled = (settings?.[REVIEW_KEYS.enabled] ?? "false") === "true";
  const rawUrl = settings?.[REVIEW_KEYS.url] ?? "";
  const provider = settings?.[REVIEW_KEYS.provider] || "trustpilot";
  const verifiedAt = settings?.[REVIEW_KEYS.verifiedAt] ?? "";
  const check = checkReviewUrl(rawUrl);

  if (!enabled) {
    return {
      enabled,
      provider,
      rawUrl,
      verifiedAt,
      url: null,
      unavailableMessage: REVIEW_MESSAGES.disabled,
    };
  }
  if (!check.ok) {
    return {
      enabled,
      provider,
      rawUrl,
      verifiedAt,
      url: null,
      unavailableMessage: REVIEW_MESSAGES[check.problem],
    };
  }
  return { enabled, provider, rawUrl, verifiedAt, url: check.url, unavailableMessage: null };
}

export function usePublicReview() {
  const settings = useQuery({
    queryKey: ["help_settings"],
    queryFn: fetchHelpSettings,
    staleTime: 60_000,
  });
  return { ...settings, review: readPublicReviewState(settings.data) };
}

/**
 * Stores an anonymous click event only. No stars, comment, school category,
 * conversation, name, email or student id is ever recorded or sent outward.
 */
export async function logReviewButtonClick(input: {
  provider?: string;
  schoolId?: string | null;
  surface?: string;
}) {
  await db("public_review_events")
    .insert({
      event_name: "trustpilot_button_clicked",
      provider: (input.provider ?? "trustpilot").slice(0, 40),
      school_id: input.schoolId ? input.schoolId.slice(0, 40) : null,
      surface: input.surface ? input.surface.slice(0, 40) : null,
    })
    .then(
      () => undefined,
      () => undefined,
    );
}
