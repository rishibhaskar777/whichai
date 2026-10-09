# Setting up sign-in

Sign-in is optional. Without these steps the site works and the Sign in popup says "Sign-in is not configured on this server".

Everything here is free. **You do not need a billing account or a credit card** for basic Google or GitHub sign-in. If either site asks for payment details, stop; you are in the wrong place.

**Never commit `.env.local`.** It is already in `.gitignore`. Anyone with your client secrets can pretend to be your app.

## 1. Make the secret for the session cookie

The secret encrypts the sign-in cookie. Generate 32 random bytes. In a terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output. It is about 44 characters. Changing it later signs everyone out.

## 2. Create a Google OAuth client

1. Go to https://console.cloud.google.com and sign in with a Google account.
2. Create a project from the project picker at the top (for example "WhichAI"). Skip any prompt to add billing.
3. Open the menu, then **APIs & Services**, then **OAuth consent screen** (it may be called **Google Auth Platform**).
4. Choose **External** and create it. Fill in:
   - App name: WhichAI
   - User support email and developer contact email: your email
   - Privacy policy link: your site's `/privacy` page (for local testing `http://localhost:3000/privacy` is fine; use the live address before publishing)
5. Scopes: add only `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile`. These are the basic scopes and need no review. Add nothing else.
6. While the app is in **Testing**, only the test users you list can sign in. Add your own Google account there. To let anyone sign in, choose **Publish app**. Basic scopes do not need Google's verification.
7. Open **Credentials**, then **Create credentials**, then **OAuth client ID**. Application type: **Web application**.
8. Under **Authorised redirect URIs** add:
   - `http://localhost:3000/api/auth/callback/google`
   - later, your live site: `https://your-domain/api/auth/callback/google`
9. Create it. Copy the **Client ID** and **Client secret**.

## 3. Create a GitHub OAuth app

1. On GitHub open **Settings**, then **Developer settings**, then **OAuth Apps**, then **New OAuth App**.
2. Fill in:
   - Application name: WhichAI
   - Homepage URL: `http://localhost:3000` (change it to the live address later)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Register the application, then choose **Generate a new client secret**. Copy the **Client ID** and the secret now; GitHub shows the secret once.

GitHub allows one callback URL per app. For the live site, create a second OAuth app with the live callback URL and use its values in the host's settings.

## 4. Put the values in `.env.local`

Copy `.env.example` to `.env.local` if you have not already, then fill in the names below with your own values. No quotes, no spaces around `=`.

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_SECRET=<the output from step 1>
GOOGLE_CLIENT_ID=<from Google>
GOOGLE_CLIENT_SECRET=<from Google>
GITHUB_CLIENT_ID=<from GitHub>
GITHUB_CLIENT_SECRET=<from GitHub>
```

You can set up only one provider. The other button will not appear.

Restart `npm run dev` after changing `.env.local`. Open http://localhost:3000 (not `127.0.0.1`; the address must match `NEXT_PUBLIC_SITE_URL` and the redirect URIs exactly), choose **Sign in** and try each button.

## 5. Going live later

Set the same six variables in your host's settings, not in the code. Set `NEXT_PUBLIC_SITE_URL` to the live address (`https://...`) before building, because it is fixed at build time. Add the live redirect URI to the Google client and use a GitHub OAuth app with the live callback URL.

## If something goes wrong

| What you see                                             | Likely cause                                                                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| "Sign-in is not configured on this server"               | A variable is empty or missing. `AUTH_SECRET` must be at least 43 characters. Restart the server                                       |
| Google says `redirect_uri_mismatch`                      | The redirect URI in Google differs from the one the site sends. Check the port, `http` or `https`, and `localhost` against `127.0.0.1` |
| Google says the app is not verified or access is blocked | The app is in Testing and your account is not listed as a test user, or you added scopes beyond the basic three                        |
| Back on the sign-in page with "We couldn't sign you in"  | The secret was copied wrongly, the callback URL differs, or the sign-in took longer than 10 minutes                                    |
