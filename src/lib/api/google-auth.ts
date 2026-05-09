/**
 * Google Identity Services (GIS) — browser-only OAuth 2.0 token flow.
 * No backend required. Tokens are kept in memory (lost on page reload).
 */

export type GoogleScope = "gmail" | "calendar";

const SCOPES: Record<GoogleScope, string> = {
  gmail: "https://www.googleapis.com/auth/gmail.readonly",
  calendar: "https://www.googleapis.com/auth/calendar.readonly",
};

const tokenMap: Partial<Record<GoogleScope, string>> = {};

export function getToken(scope: GoogleScope): string | null {
  return tokenMap[scope] ?? null;
}

export function hasToken(scope: GoogleScope): boolean {
  return !!tokenMap[scope];
}

export async function requestGoogleToken(
  scope: GoogleScope
): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");

  const gis = (window as unknown as { google?: { accounts?: { oauth2?: unknown } } }).google;
  if (!gis?.accounts?.oauth2) {
    throw new Error("Google Identity Services script not loaded");
  }

  return new Promise<string>((resolve, reject) => {
    const client = (gis.accounts.oauth2 as {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (resp: { error?: string; access_token?: string }) => void;
      }) => { requestAccessToken: (opts: { prompt: string }) => void };
    }).initTokenClient({
      client_id: clientId,
      scope: SCOPES[scope],
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }
        tokenMap[scope] = resp.access_token!;
        resolve(resp.access_token!);
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

export function revokeToken(scope: GoogleScope): void {
  const token = tokenMap[scope];
  if (!token) return;
  const gis = (window as unknown as { google?: { accounts?: { oauth2?: { revoke?: (t: string, cb?: () => void) => void } } } }).google;
  gis?.accounts?.oauth2?.revoke?.(token);
  delete tokenMap[scope];
}
