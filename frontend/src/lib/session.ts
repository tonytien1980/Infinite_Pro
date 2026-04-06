import type { SessionState } from "@/lib/types";

export function isAuthError(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  return status === 401 || status === 403;
}

export function getLoginPath(nextPath?: string) {
  if (!nextPath || nextPath === "/login") {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function getSessionDisplayName(session: SessionState | null) {
  if (!session) {
    return "";
  }
  return session.user.fullName || session.user.email;
}
