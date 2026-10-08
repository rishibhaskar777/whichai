# 0001: Technology stack

Status: accepted

## Context

The product is a content-and-logic website with a search-style input, structured recommendation data, saved plans and an update pipeline. It must be fast, indexable by search engines, secure, and maintainable by one or two people.

## Decision

- **One language: TypeScript**, in strict mode, for UI, server code, data validation, configuration and tests. One language means one toolchain, shared types between client and server, and fewer places for mistakes.
- **Next.js (App Router) with React.** Server rendering gives a fast first load and indexable public pages. Route handlers and middleware cover the small server surface without a separate backend service.
- **CSS Modules with CSS custom properties** for styling and design tokens. No utility-class framework and no component library, so the interface is designed for this product, the CSP stays simple, and the dependency list stays short.
- **Zod** for validating all external input (requests, environment variables, data files).
- **Vitest** for unit tests. End-to-end tests are added in a later phase.
- **PostgreSQL** (hosted) with a typed query layer, added in Phase 3. Authentication in Phase 4 uses a maintained library, not custom code.
- **Motion library** (the successor to Framer Motion) for interface animation where CSS alone is not enough.
- **Self-hosted fonts** through the framework font loader, so there are no third-party font requests.

## Consequences

- Contributors need to know TypeScript and React only.
- Some components that a library would provide (dialogs, menus) are written and tested here, with accessibility in mind.
- Any later change of framework or database requires a new decision record.

## Alternatives considered

- A separate backend in another language: more flexibility, but two toolchains and duplicated types.
- A utility-class CSS framework or prebuilt component kit: faster at first, but a generic look and more build and CSP surface.
