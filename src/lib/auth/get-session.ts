import { cookies } from "next/headers";
import { getAuthConfig, isProduction } from "./config";
import { createCsrfToken } from "./csrf";
import { decodeSession, sessionCookieName, type SessionData } from "./session";

/* The signed-in person, or null. Use this in server components and route handlers. */
export async function getSession(): Promise<SessionData | null> {
  return (await readSession())?.session ?? null;
}

export interface Viewer {
  name: string;
  signOutToken: string;
}

/* What the page needs to draw the account menu: a name and the sign-out CSRF token. */
export async function getViewer(): Promise<Viewer | null> {
  const found = await readSession();
  if (!found) return null;
  return {
    name: found.session.name,
    signOutToken: await createCsrfToken(found.token, found.secret),
  };
}

async function readSession() {
  const config = getAuthConfig();
  if (!config) return null;
  const token = (await cookies()).get(sessionCookieName(isProduction()))?.value;
  if (!token) return null;
  const session = await decodeSession(token, config.secret);
  return session ? { session, token, secret: config.secret } : null;
}
