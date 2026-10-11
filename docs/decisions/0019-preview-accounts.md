# 0019: Preview accounts and guests

Status: accepted. Changes the sign-in popup described in [0008](0008-sign-in.md).

## Context

The popup listed six ways to sign in and four of them said "coming soon". People should be able to see a normal log in and register flow, and to use WhichAI as a guest, before online accounts exist. The [zero-cost rule](0006-zero-cost.md) rules out a database, a hosted auth service and email, so a real account system cannot be built yet.

## Decision

The popup has two views, Log in and Register, and nothing else.

- Google stays exactly as it was: a link to the server's OAuth route when it is configured, otherwise a "coming soon" message.
- GitHub, Microsoft, Apple, email and phone were removed from the popup. The GitHub routes and configuration stay on the server, so an existing GitHub session still works.
- Email and password accounts are **preview accounts**: they exist only in the browser where they were made, in the storage layer from [0009](0009-local-first-data.md). The popup says so in both views.
- "Continue without signing in" makes a **guest profile** and closes the popup.

### Where it lives

`src/lib/auth/local-preview.ts` exports the `AccountService` interface (`register`, `login`, `logout`, `currentUser`, plus `startGuest`, `currentGuest` and `deleteLocalData`) and one implementation, `createLocalPreviewService(kv)`. The interface speaks in plain results (`{ ok: false, reason: "duplicate" }`) and never in browser types, so components do not know it is local.

`AccountProvider` (`src/components/account/`) opens the service once, reads the current user and guest, and gives components `useAccount()`. A Google session comes from the server as a `Viewer` and wins wherever both exist.

### What is stored

Four keys in the same key-value backend as plans (IndexedDB, then localStorage, then memory). They are separate from the plan collections, so Export, Import and "Clear all data" never touch them.

| Key                | Holds                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `preview-accounts` | per account: id, email (trimmed, lower case), first and last name, password hash, created date |
| `preview-session`  | the id of the logged-in account and when it started                                            |
| `preview-guest`    | a random id and a created date, nothing else                                                   |
| `preview-lockout`  | a count of failed attempts and the time until which logging in is paused                       |

Every record is validated with Zod when read, and one that fails is ignored.

### Passwords

- The plain password is never written anywhere. It is hashed with Web Crypto PBKDF2, SHA-256, 600,000 iterations and a random 16-byte salt per account. The algorithm, iteration count and salt are stored with the hash, so the count can rise later and old records still verify.
- Passwords are normalised with NFKC before hashing, so the same typed password matches on every keyboard.
- The hash is compared with a loop that touches every byte. A login for an email with no account still derives a hash, so a missing account takes as long as a wrong password.
- A login failure is always "Email or password is incorrect." After five failures logging in pauses for 30 seconds. This is a courtesy against fat fingers, not a defence: the data is in the person's own browser and can be read or reset by them.
- Registration accepts 8 to 128 characters and has no symbol rules. It rejects the passwords in `src/lib/auth/common-passwords.ts`, a bundled list of about 2,200 widely used passwords and patterns, ignoring case. The list is compiled for this project and is not an official one.

### What it is not

A preview account is not a security boundary. Anyone who can use the browser profile can read the stored hash, and a weak password can be guessed offline. There is no password reset, no email check and no sync. The privacy page says all of this.

### Names and email

First and last name are 1 to 50 characters: any letter in any script, combining marks (so Hindi vowel signs work), spaces, hyphens and apostrophes, starting with a letter. Email is checked with Zod's email rule and is never sent anywhere.

### Interface

- Both views share one dialog and one set of fields. Switching cross-fades and animates the dialog's height (not under reduced motion), then moves focus to the new title.
- `/?auth=login` and `/?auth=register` open the dialog in that view and then clean the query with `history.replaceState`.
- Validation runs with Zod on every submit. Errors show under each field, tied by `aria-describedby`, and a summary that names the fields takes focus. The submit button is disabled while the request is under way.
- The primary button uses the accent colour with `--on-accent` text, which is a deliberate exception to "primary buttons are filled with the text colour" in the design principles, because the sign-in dialog has one clear primary action. `src/styles/contrast.test.ts` checks the pair in every theme.
- After registering, the person is sent back to Log in with the email filled and the message "Account created. Log in to continue." They are not logged in automatically.

### Terms and privacy

`/terms` is now a full draft of terms of service and `/privacy` covers preview accounts, hashed passwords, the guest profile, cookies, news feeds, rights under India's DPDP Act 2023 and how to delete local data. Both carry "Draft, pending legal review." The terms are English only in every language until they have been reviewed, and the Hindi page says so.

### Deleting local data

Settings, Account, "Delete local account and data" (the word `DELETE` must be typed) removes the four keys and also clears plans, history and settings.

## Replacing it with a real backend

1. Write a class that implements `AccountService` against the new backend, for example `createHostedService(fetch)`. `register` and `login` keep their result types, and `retryAfterSeconds` comes from the server's own rate limiting.
2. Pick the implementation in `AccountProvider` (`getService`). Nothing under `src/components/sign-in/` imports the preview module.
3. Remove `local-preview.ts`, `password-hash.ts` and `common-passwords.ts`, or keep the hash and list on the server where the password rule is enforced. The Zod schemas in `preview-schemas.ts` stay as the shared shape of the forms; the stored-record schemas go.
4. Drop the "Preview:" label (`signin.preview`) and the preview section of the privacy page, and add a way to move or discard existing preview accounts, because they will not exist on the server.
5. Hash passwords on the server with a memory-hard function (argon2id or scrypt), add email verification and a password reset, and set `Secure`, `HttpOnly` cookies for the session.

## Consequences

- A person can try the whole flow with no server and no cost.
- Accounts do not follow a person to another browser, and clearing site data removes them. This is stated in the dialog.
- The 600,000-iteration hash costs about a quarter of a second per attempt, and the browser does it off the main thread.
- The common-password list is a small, hand-compiled sample. It catches the obvious choices and nothing more.
- Two tabs can both write the account list. Writes inside one tab are queued, but a second tab can overwrite the first's new account. The risk is accepted for a preview.
