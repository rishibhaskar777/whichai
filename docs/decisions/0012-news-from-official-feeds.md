# 0012: News from official feeds

Status: accepted. Amended: the parser is `fast-xml-parser`, and the weekly workflow checks the sources. Applies [0006](0006-zero-cost.md) and [0009](0009-local-first-data.md), and replaces the plan in the roadmap to open pull requests from a scheduled script.

## Context

The side panel showed five invented headlines marked "Sample content", and What Changed was a "coming soon" page. People should see what has actually changed in the tools they are choosing between, from the companies that make them, without the project paying for a news API, an AI summariser or a database ([0006](0006-zero-cost.md)).

Official sites publish RSS or Atom feeds. GitHub publishes an Atom feed of releases for every repository. Reading these is free, needs no key, and the source of every headline is the maker itself.

## Decision

### Sources are a reviewed list, not user input

`src/data/news/sources.json` lists each source: `id`, `name`, `feedUrl`, `homepage`, `officialDomains`, `toolIds` and `defaultTag`. It is validated with Zod at start-up and in tests, which also check that every `toolIds` entry exists in the catalogue and that the feed and homepage sit on the source's own domains.

- Only official sources: company blogs and newsrooms, official changelogs, and `releases.atom` feeds of repositories the company owns. No aggregators, no social media, no rumour sites.
- A feed is listed only after it was fetched and parsed. [NEWS-SOURCES.md](../NEWS-SOURCES.md) is the procedure for adding or removing one.
- The server fetches the addresses in that file and nothing else. No visitor-supplied value reaches a request, so there is no request forgery surface.

### Fetching happens on the server and is cached in memory

`src/lib/news/service.ts` keeps the last good items of each feed and refreshes all of them in parallel at most once every 30 minutes.

- Each request is https only, has a 5 second timeout, follows no redirect and stops reading at 1 MB (`fetch-feed.ts`). A feed that has moved is a source to fix, so a redirect counts as a failure.
- The first call after a start waits for the refresh. After that a stale answer is returned at once and the refresh runs in the background, so no visitor waits for a news site.
- A failing feed keeps its last good items and logs one warning for the outage (the feed id and a short reason, nothing from the response). The page never fails because of news.
- If every feed fails, the interface says "News is temporarily unavailable" and shows the time of the last successful update. Items already held are still shown, because an old headline with its age is more useful than none.
- The cache is per server process. On a host that runs several instances each has its own, and each makes its own requests at most every 30 minutes. That is acceptable at this scale and needs no shared store.
- The production build does not fetch. It gets an empty list.
- The browser never requests a news site. The CSP `connect-src` stays `'self'`.

### Parsing is configured to be strict

A feed is untrusted input from a third party. Items are read with `src/lib/news/parse-feed.ts`, which uses `fast-xml-parser` (MIT, free) for RSS 2.0, RSS 1.0 and Atom. The first version of this feature used a reader written for the project, and was replaced (see "Why a library" below).

- The parser runs with `processEntities: false` and `htmlEntities: false`. `<!DOCTYPE>` blocks, with any internal subset, are removed from the text before parsing, so no entity can be declared, internal or external, and nothing is ever expanded or fetched.
- Entities are decoded afterwards, by the plain-text step, which knows the five XML entities, numeric references (decimal and hex, invalid ones left as text) and a short list of common HTML names such as `&nbsp;` and `&rsquo;`. Text such as `&lt;script&gt;` decodes to markup and is then stripped.
- CDATA is kept apart (`cdataPropName`) from escaped text, so raw and escaped markup are handled correctly. Attributes are parsed, because Atom carries links in `href` and `rel`. Values stay strings (no number or date coercion), and namespaced names such as `dc:date` and `content:encoded` are kept as written, so `atom:link` is never mistaken for `link`.
- Nesting is limited to 40 levels (`maxNestedTags`). The input is cut at 1 MB before parsing, in addition to the 1 MB read limit of the fetcher. At most 2000 entries are looked at, and text used for a summary is cut to 20,000 characters before any pattern runs.
- A truncated or malformed feed is repaired once by keeping everything up to the last complete entry and closing the document, so the complete entries survive. If that fails too, or the text is not a feed (a login page, an error page), the feed counts as failed and its last good items are kept.
- An item is kept as `{ id, title, url, publishedAt, sourceId, sourceName, summary, tag, toolIds }`. The summary is plain text of at most 160 characters taken from the feed's own description; articles are never copied.
- Tags and markup are removed, `<script>` and `<style>` blocks are removed with their content, and everything is rendered as text by React. There is no `dangerouslySetInnerHTML`.
- The link must be https, carry no credentials, and be on the source's `officialDomains` (the same rule as download links in [0011](0011-get-it-links.md), including `github.com/owner`). Anything else drops the item.
- Items are de-duplicated by link, sorted newest first, and dropped when older than 60 days, future-dated, or without a valid date. A missing date is not guessed.
- In a GitHub releases feed, pre-releases (`rc`, `alpha`, `beta`, `nightly`, `canary`, `preview`) are skipped and only the five newest releases are kept, so a chatty repository does not drown out blog posts.

#### Why a library, after all

The reader written first was about 250 lines and avoided a dependency, on the reasoning that a tolerant string search has a smaller attack surface than a general parser. It worked, but it was one more piece of hand-written text processing to maintain and to trust: XML has edge cases (attribute quoting, nested CDATA, namespaces, comments, processing instructions) that a maintained parser with a public history handles and that a hand-written one handles only as far as its tests reach. Replacing it with `fast-xml-parser` moves that work to code that many projects exercise, and the safety properties are now stated as configuration and tests instead of as a property of our own scanning code.

The cost is a runtime dependency to keep updated, and a configuration surface where the safe settings have to be kept. They are fixed in one place, `parse-feed.ts`, and the parser tests (hostile DTD, numeric and HTML entities, CDATA, namespaces, depth, size, truncation) fail if one is loosened. The library also parses a DOCTYPE even with entity processing off and throws on an external entity, which is why the DOCTYPE is removed before it sees the text.

### Tags and tools are rules

`tagging.ts` assigns one of `new-model`, `new-tool`, `feature-update`, `pricing`, `policy`, `research`, `other` from keyword rules on the title, then on the summary for the strong tags, falling back to the source's `defaultTag`. `tool-match.ts` adds catalogue tools named in the title (whole-word, case-sensitive, never for names that are common English words) to the source's own `toolIds`.

Both are heuristics. They mislabel some headlines, for example a customer story that mentions a model name. The tag is a hint and the headline links to the source.

### What the interface shows

- The panel shows the six newest items, with at most two from one source so a daily release feed cannot fill it. Each has the source, a relative time in the user's language, the title as the link, a tag dot and label, and a "New" badge under 24 hours.
- Relative times are measured from the time the server made the list, so the server and browser render the same text.
- `/what-changed` is server-rendered, 20 per page, with search, tag and source in a plain GET form whose values live in the URL and are validated with fallbacks.
- Each tool page lists up to five recent items for that tool.
- "Affects your plans" is computed in the browser: saved plans are rebuilt with the same engine that draws a plan, and an item is flagged when it names a tool that a plan puts forward at any level or that the person said they use. Nothing is sent. The engine and catalogue load only when a saved plan exists, and only when the browser is idle.
- Headlines and summaries keep the language they were published in. Interface text is English and Hindi.

## Consequences

- The site is only as current as the last refresh, up to 30 minutes plus the time a feed takes to update.
- A source can break without anyone noticing until its items stop appearing. The server log shows one warning per outage. The weekly workflow also runs `npm run news:check`, which fetches every source and reports feeds that fail, are not feeds, return no items, or whose newest item is older than 60 days; findings go in the same "Broken catalogue links" issue under a "News sources" heading.
- Feeds differ. Some have no description, some no dates (the Google for Developers blog feed has none and is not listed), and some are very large (Vercel's changelog exceeds 1 MB, so only its newest entries are read).
- Several companies have no usable official feed and are not covered. They are listed in NEWS-SOURCES.md.
- Headlines are third-party text. They are shown as text, from official domains only, but their content is not reviewed by this project.
- If the project later needs news to survive a restart or to be shared between instances, that needs storage and goes back to the project owner.
