/*
 * Password hashing for preview accounts, done with the browser's Web Crypto
 * API. PBKDF2 with SHA-256 and 600,000 iterations is the current OWASP
 * recommendation for PBKDF2-HMAC-SHA256. Each hash has its own random salt.
 */
export const PBKDF2_ITERATIONS = 600_000;

let defaultIterations = PBKDF2_ITERATIONS;

/** The iteration count a new hash uses unless the caller names one. */
export function getPasswordIterations(): number {
  return defaultIterations;
}

/*
 * Lets tests hash quickly. Pass null to restore the production value. It does
 * nothing in a production build, so the count there is always 600,000.
 */
export function setPasswordIterations(count: number | null): void {
  if (process.env.NODE_ENV === "production") return;
  defaultIterations = count ?? PBKDF2_ITERATIONS;
}
const SALT_BYTES = 16;
const HASH_BITS = 256;

export const HASH_ALGORITHM = "PBKDF2-SHA-256";

export interface PasswordHash {
  algorithm: typeof HASH_ALGORITHM;
  iterations: number;
  /* Base64 of the 16-byte salt. */
  salt: string;
  /* Base64 of the 32-byte derived key. */
  hash: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  // NFKC makes the same typed password hash the same on every keyboard.
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations,
    },
    material,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/* Compares every byte, so the time taken does not reveal where they differ. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

export async function hashPassword(
  password: string,
  iterations: number = defaultIterations,
): Promise<PasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derive(password, salt, iterations);
  return {
    algorithm: HASH_ALGORITHM,
    iterations,
    salt: toBase64(salt),
    hash: toBase64(derived),
  };
}

export async function verifyPassword(
  password: string,
  stored: PasswordHash,
): Promise<boolean> {
  const derived = await derive(
    password,
    fromBase64(stored.salt),
    stored.iterations,
  );
  return constantTimeEqual(derived, fromBase64(stored.hash));
}
