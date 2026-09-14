import { SITE_URL } from "./env";

/**
 * Only allow redirects to paths inside this app. Auth query-string values can
 * be controlled by a user, so never pass an absolute URL through to a router
 * or an auth callback.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}

/**
 * Build an auth redirect URL for the current app. In the browser, the current
 * origin is the most reliable value for local development, Netlify deploy
 * previews, and production. SITE_URL remains the server-side fallback.
 */
export function getAuthRedirectUrl(path: string, next?: string): string {
  const base = typeof window === "undefined" ? SITE_URL : window.location.origin;
  const url = new URL(path, base);

  if (next) {
    url.searchParams.set("next", safeRedirectPath(next));
  }

  return url.toString();
}
