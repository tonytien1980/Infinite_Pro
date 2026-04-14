import type { SessionState } from "@/lib/types";

export function isAuthError(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  return status === 401 || status === 403;
}

export function shouldRedirectToLoginAfterLogout(error: unknown) {
  return error == null || isAuthError(error);
}

export function getLoginPath(nextPath?: string) {
  if (!nextPath || nextPath === "/login") {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function resolveLoginNextPath(search: string) {
  const params = new URLSearchParams(search);
  const nextPath = params.get("next");
  if (!nextPath) {
    return null;
  }
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }
  if (nextPath === "/login" || nextPath.startsWith("/login?")) {
    return null;
  }
  return nextPath;
}

export function getSessionDisplayName(session: SessionState | null) {
  if (!session) {
    return "";
  }
  return session.user.fullName || session.user.email;
}
