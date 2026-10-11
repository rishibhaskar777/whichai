import { z } from "@/lib/schemas/zod";
import { isCommonPassword } from "./common-passwords";
import { HASH_ALGORITHM } from "./password-hash";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;

/*
 * Issue messages are interface message keys, so the form can show them in the
 * visitor's language. Each one exists in src/lib/i18n/en.ts.
 */
const MESSAGE = {
  emailRequired: "auth.error.email.required",
  emailInvalid: "auth.error.email.invalid",
  passwordRequired: "auth.error.password.required",
  passwordShort: "auth.error.password.short",
  passwordLong: "auth.error.password.long",
  passwordCommon: "auth.error.password.common",
  firstNameRequired: "auth.error.firstName.required",
  firstNameInvalid: "auth.error.firstName.invalid",
  firstNameLong: "auth.error.firstName.long",
  lastNameRequired: "auth.error.lastName.required",
  lastNameInvalid: "auth.error.lastName.invalid",
  lastNameLong: "auth.error.lastName.long",
  terms: "auth.error.terms.required",
} as const;

/* Trimmed and lower-cased, so "Ada@Example.com " and "ada@example.com" match. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, MESSAGE.emailRequired)
  .max(MAX_EMAIL_LENGTH, MESSAGE.emailInvalid)
  .pipe(z.email(MESSAGE.emailInvalid));

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, MESSAGE.passwordRequired)
    .max(MAX_PASSWORD_LENGTH, MESSAGE.passwordLong),
});
export type LoginInput = z.infer<typeof loginSchema>;

/*
 * Any script is fine: letters and combining marks (so Devanagari vowel signs
 * work), spaces, hyphens and apostrophes. It must start with a letter.
 */
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}' ’-]*$/u;

function nameSchema(
  required: string,
  invalid: string,
  long: string,
): z.ZodType<string, string> {
  return z
    .string()
    .trim()
    .min(1, required)
    .refine((value) => Array.from(value).length <= MAX_NAME_LENGTH, long)
    .refine((value) => NAME_PATTERN.test(value), invalid);
}

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, MESSAGE.passwordRequired)
    .min(MIN_PASSWORD_LENGTH, MESSAGE.passwordShort)
    .max(MAX_PASSWORD_LENGTH, MESSAGE.passwordLong)
    .refine((value) => !isCommonPassword(value), MESSAGE.passwordCommon),
  firstName: nameSchema(
    MESSAGE.firstNameRequired,
    MESSAGE.firstNameInvalid,
    MESSAGE.firstNameLong,
  ),
  lastName: nameSchema(
    MESSAGE.lastNameRequired,
    MESSAGE.lastNameInvalid,
    MESSAGE.lastNameLong,
  ),
  terms: z.boolean().refine((value) => value, MESSAGE.terms),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** The first problem for each field, as an interface message key. */
export function firstIssues<Field extends string>(
  error: z.ZodError,
): Partial<Record<Field, string>> {
  const issues: Partial<Record<Field, string>> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0]) as Field;
    if (issues[field] === undefined) issues[field] = issue.message;
  }
  return issues;
}

/* What is written to the browser. The password is only ever a hash. */
export const passwordHashSchema = z.object({
  algorithm: z.literal(HASH_ALGORITHM),
  iterations: z.number().int().min(1),
  salt: z.string().min(1).max(64),
  hash: z.string().min(1).max(128),
});

export const accountRecordSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  email: z.string().min(1).max(MAX_EMAIL_LENGTH),
  firstName: z.string().min(1).max(200),
  lastName: z.string().min(1).max(200),
  password: passwordHashSchema,
  createdAt: z.iso.datetime(),
});
export type AccountRecord = z.infer<typeof accountRecordSchema>;

export const sessionRecordSchema = z.object({
  userId: z.string().min(1).max(64),
  startedAt: z.iso.datetime(),
});

export const guestProfileSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  createdAt: z.iso.datetime(),
});
export type GuestProfile = z.infer<typeof guestProfileSchema>;

export const lockoutSchema = z.object({
  failures: z.number().int().min(0),
  lockedUntil: z.number().int().min(0),
});
export type Lockout = z.infer<typeof lockoutSchema>;
