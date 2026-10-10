# News sources

The AI news panel and the What Changed page read public RSS and Atom feeds listed in [`src/data/news/sources.json`](../src/data/news/sources.json). This page explains how to add, change or remove a source safely. The reasons are in [0012](decisions/0012-news-from-official-feeds.md).

## Rules for a source

- It is official: the company's own blog or newsroom, its own changelog, or a `releases.atom` feed of a repository the company owns. Not an aggregator, a social network, a newsletter, a fan site or a rumour site.
- It is a feed you fetched and read. Do not list a feed that you have not opened.
- It is https, and its address is the final address. The fetcher follows no redirect, so a feed that redirects is listed under the address it redirects to.
- Items carry their own dates. A feed without dates cannot be sorted or aged and is not listed.
- Story links are on the source's own domains (see below).

## The fields

| Field             | Meaning                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | Lowercase letters, digits and dashes. Unique. Used in the URL filter (`?source=`).                                                       |
| `name`            | What people see next to a headline, such as "Cursor changelog".                                                                          |
| `feedUrl`         | The exact feed address. Unique.                                                                                                          |
| `homepage`        | The human page the feed belongs to.                                                                                                      |
| `officialDomains` | Hosts a story link may use. A host covers its subdomains. `github.com/owner` limits a shared host to one owner's repositories.           |
| `toolIds`         | Catalogue tool ids the source is about. Every item from the source gets these. Keep them to the product the source is about (see below). |
| `defaultTag`      | `new-model`, `new-tool`, `feature-update`, `pricing`, `policy`, `research` or `other`. Used when no keyword rule matches the title.      |

### Choosing `toolIds`

Every item from a source is attached to its `toolIds`, and an item attached to a tool in a person's saved plan is flagged "Affects your plans". Over-attaching therefore sends people to news that is not about their tools.

- A changelog or release feed of one product: that product.
- A company blog about many products: the one or two main products, not all of them. Other tools named in a headline are matched from the title automatically.
- A research blog: the products it clearly supports, or none.

### Choosing `officialDomains`

Look at the `link` values in the feed, not only at the homepage. Many blogs link to a second host (`blog.google` for DeepMind posts, `notion.so` next to `notion.com`). Add the host only if it belongs to the same company. If most items are dropped, the domain list is the usual cause.

## Adding a source

1. Find the feed. Try the site's link tags, `/feed`, `/rss`, `/rss.xml`, `/atom.xml`, `/blog/rss.xml`, and `https://github.com/<owner>/<repo>/releases.atom` for a repository.
2. Fetch it and look at it:

   ```bash
   curl -sIL https://example.com/feed.xml | head -20   # status, final address, content type, size
   curl -sL https://example.com/feed.xml | head -c 2000 # a real feed starts with <rss, <feed or <rdf:RDF
   ```

3. Check that it has items with dates (`pubDate`, `published`, `updated` or `dc:date`) and links on the company's domains, and that the newest item is recent.
4. Note the size. The fetcher reads at most 1 MB. A bigger feed still works if its newest entries come first.
5. Add the record to `sources.json`, with `toolIds` that exist in the catalogue.
6. Run `npm run news:check`; it fetches every source with the same code as the site and prints the ones that fail, are not feeds, have no usable items or are quiet. Then run `npm test`. `src/lib/news/sources.test.ts` checks the schema, that the feed and homepage are on the source's domains and that every tool id exists.
7. Start the app (`npm run build && npm start`), open `/what-changed?source=<id>` and look at what came through: titles, summaries, tags, links. Check the server log for a warning naming the source.
8. Commit the file with a message such as `feat(news): add Example Labs blog`.

## Removing or changing a source

Delete the record, or edit the address, and run the tests. Nothing else refers to a source id except links people may have saved with `?source=<id>`, which fall back to "all sources".

Remove a source when its feed has been dead for a while (the server log shows one warning per outage), when it has stopped publishing for more than 60 days (nothing would be shown anyway), or when it is no longer official.

## The weekly check

The weekly workflow (`.github/workflows/link-check.yml`) runs `npm run news:check` next to the catalogue link check. A source is reported when its request fails, the response is not a feed, it yields no items (empty, undated, or links off its domains), or its newest item is older than 60 days. Problems go in the same "Broken catalogue links" issue under a "News sources" heading, and the issue is closed when both checks are clean. A report means: fix the address or domains, or remove the source.

## What the server does with a feed

So that you know what is safe to add:

- It requests only the addresses in this file, with a 5 second timeout, over https, with no redirect, and reads at most 1 MB.
- It keeps the last good items if a feed fails and refreshes at most every 30 minutes.
- It keeps title, link, date, source and a plain-text summary of at most 160 characters. HTML is removed, never rendered.
- It drops items whose link is not https or not on `officialDomains`, items older than 60 days, future-dated items and items without a date.
- In a releases feed it skips pre-releases and keeps the five newest.

## Sources checked and not listed

Fetched or tried on 2026-10-10. A company is missing when it has no feed this reader can use, not because it was left out on purpose.

| Company or tool            | Result                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic                  | No feed for its news, engineering or docs release notes (the addresses tried returned 404 or a web page). Only Claude Code releases are listed. |
| Perplexity                 | The hub feed answered 403 to a script.                                                                                                          |
| Midjourney                 | The updates feed answered 403 to a script.                                                                                                      |
| xAI                        | No feed found at the addresses tried (404).                                                                                                     |
| Adobe                      | The blog feed answered 403 and the newsroom has no feed found.                                                                                  |
| Canva                      | The newsroom feed address returned 404.                                                                                                         |
| Runway                     | No feed found (404).                                                                                                                            |
| Suno                       | No feed found (404).                                                                                                                            |
| Black Forest Labs          | No feed found (404). The `flux` repository has no releases.                                                                                     |
| DeepSeek                   | No feed. The API docs "news" page is a web page, and the `DeepSeek-V3` repository's last release is from 2025.                                  |
| Qwen                       | The blog feed works but its newest item is from September 2025, so nothing would be shown.                                                      |
| Cohere                     | No feed found at the addresses tried.                                                                                                           |
| Meta AI blog               | `ai.meta.com/blog` has no feed (404). The Meta Newsroom AI tag feed is listed instead.                                                          |
| OpenAI help centre         | ChatGPT release notes are a web page, not a feed.                                                                                               |
| Aider                      | The releases feed works but its newest release is from February 2026.                                                                           |
| Google for Developers blog | The feed has no dates on its items.                                                                                                             |

Feeds that work and were left out because they are not about tools in the catalogue: NVIDIA, AWS Machine Learning, Cloudflare, Supabase, Together AI, LangChain, JetBrains AI, Stripe, Node.js, React, Tailwind CSS, WordPress, Blender.

## Listed sources

| Id                    | Name                        | Feed                                                    | Default tag    |
| --------------------- | --------------------------- | ------------------------------------------------------- | -------------- |
| openai-news           | OpenAI                      | openai.com/news/rss.xml                                 | other          |
| openai-codex          | OpenAI Codex CLI releases   | github.com/openai/codex/releases.atom                   | feature-update |
| anthropic-claude-code | Claude Code releases        | github.com/anthropics/claude-code/releases.atom         | feature-update |
| google-ai-blog        | Google AI blog              | blog.google/innovation-and-ai/technology/ai/rss/        | other          |
| google-gemini-blog    | Google Gemini blog          | blog.google/products-and-platforms/products/gemini/rss/ | feature-update |
| google-deepmind-blog  | Google DeepMind             | deepmind.google/blog/rss.xml                            | research       |
| gemini-cli            | Gemini CLI releases         | github.com/google-gemini/gemini-cli/releases.atom       | feature-update |
| microsoft-research    | Microsoft Research          | microsoft.com/en-us/research/feed/                      | research       |
| github-changelog      | GitHub changelog            | github.blog/changelog/feed/                             | feature-update |
| github-ai-blog        | GitHub blog: AI and ML      | github.blog/ai-and-ml/feed/                             | other          |
| vscode-releases       | Visual Studio Code releases | github.com/microsoft/vscode/releases.atom               | feature-update |
| meta-ai-newsroom      | Meta Newsroom: AI           | about.fb.com/news/tag/ai/feed/                          | other          |
| mistral-news          | Mistral AI                  | mistral.ai/news/rss                                     | other          |
| hugging-face-blog     | Hugging Face blog           | huggingface.co/blog/feed.xml                            | other          |
| cursor-changelog      | Cursor changelog            | cursor.com/changelog/rss.xml                            | feature-update |
| replit-blog           | Replit blog                 | replit.com/blog/feed.xml                                | other          |
| lovable-blog          | Lovable blog                | lovable.dev/blog/rss.xml                                | other          |
| vercel-changelog      | Vercel changelog            | vercel.com/atom                                         | feature-update |
| ollama-blog           | Ollama blog                 | ollama.com/blog/rss.xml                                 | feature-update |
| lm-studio-blog        | LM Studio blog              | lmstudio.ai/rss.xml                                     | feature-update |
| jan-releases          | Jan releases                | github.com/janhq/jan/releases.atom                      | feature-update |
| open-webui-releases   | Open WebUI releases         | github.com/open-webui/open-webui/releases.atom          | feature-update |
| cline-releases        | Cline releases              | github.com/cline/cline/releases.atom                    | feature-update |
| zed-blog              | Zed blog                    | zed.dev/blog.rss                                        | other          |
| comfyui-releases      | ComfyUI releases            | github.com/Comfy-Org/ComfyUI/releases.atom              | feature-update |
| stability-news        | Stability AI                | stability.ai/news-updates?format=rss                    | other          |
| elevenlabs-blog       | ElevenLabs blog             | elevenlabs.io/blog/rss.xml                              | other          |
| figma-blog            | Figma blog                  | figma.com/blog/feed/atom.xml                            | other          |
| notion-releases       | Notion releases             | notion.com/releases/rss.xml                             | feature-update |
