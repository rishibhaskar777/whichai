# Security Policy

## Reporting a vulnerability

Do not open a public issue for security problems.

Use GitHub's private reporting: the **Security** tab of this repository, then **Report a vulnerability**. If that is not available, email rishibhaskar254@gmail.com.

Include what you found, how to reproduce it, and what you think the impact is. You will get an acknowledgement within a few days. Please give us reasonable time to fix the problem before sharing it publicly.

## Supported versions

Only the latest deployed version is supported.

## Security practices in this project

- Secrets live in environment variables and are never committed. `.env.local` is git-ignored; `.env.example` lists names only.
- All user input is validated on the server with a schema, regardless of client-side checks.
- A strict Content Security Policy and other security headers are set for every response.
- Dependencies are kept current through Dependabot and checked with `npm audit` in CI.
- Code scanning and secret scanning are enabled on the repository.
- The `main` branch is protected: changes arrive through reviewed pull requests with passing checks.
- No third-party scripts, fonts or trackers are loaded without a documented reason and a CSP entry.

See [docs/SECURITY-CHECKLIST.md](docs/SECURITY-CHECKLIST.md) for the checklist applied to each release.
