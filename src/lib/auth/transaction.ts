import { EncryptJWT, jwtDecrypt } from "jose";
import { z } from "zod";
import { cookieName, deriveKey } from "./session";

export const TRANSACTION_MAX_AGE_SECONDS = 10 * 60;
export const TRANSACTION_COOKIE = "whichai_oauth";

const TRANSACTION_AUDIENCE = "whichai:oauth";

const transactionSchema = z.object({
  provider: z.enum(["google", "github"]),
  state: z.string().min(1),
  codeVerifier: z.string().min(1).optional(),
  next: z.string().min(1),
});

export type Transaction = z.infer<typeof transactionSchema>;

export function transactionCookieName(isProduction: boolean): string {
  return cookieName(TRANSACTION_COOKIE, isProduction);
}

/*
 * What the callback needs to check the response is kept in a short-lived,
 * encrypted cookie on the browser that started sign-in. The server remembers
 * nothing between the two requests.
 */
export async function encodeTransaction(
  transaction: Transaction,
  secret: string,
  nowMs: number = Date.now(),
): Promise<string> {
  const issuedAt = Math.floor(nowMs / 1000);
  return new EncryptJWT({ ...transaction })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setAudience(TRANSACTION_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TRANSACTION_MAX_AGE_SECONDS)
    .encrypt(await deriveKey(secret, "oauth"));
}

export async function decodeTransaction(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): Promise<Transaction | null> {
  try {
    const { payload } = await jwtDecrypt(
      token,
      await deriveKey(secret, "oauth"),
      {
        audience: TRANSACTION_AUDIENCE,
        keyManagementAlgorithms: ["dir"],
        contentEncryptionAlgorithms: ["A256GCM"],
        currentDate: new Date(nowMs),
      },
    );
    const parsed = transactionSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/* Constant-time comparison of the state returned by the provider with the one we issued. */
export function stateMatches(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}
