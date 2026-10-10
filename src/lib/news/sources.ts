import { isOnToolDomain } from "../catalogue/links";
import { httpsUrl } from "../schemas/catalogue";
import { z } from "../schemas/zod";
import { NEWS_TAGS, type NewsSource } from "./types";

const slug = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** `example.com` or `github.com/owner`, as in a tool's `officialDomains`. */
const domain = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9.-]+\.[a-z]{2,}(\/[A-Za-z0-9._-]+)?$/i);

export const newsSourceSchema = z
  .strictObject({
    id: slug,
    name: z.string().min(1).max(60),
    feedUrl: httpsUrl,
    homepage: httpsUrl,
    officialDomains: z.array(domain).min(1).max(6),
    toolIds: z.array(slug).max(8),
    defaultTag: z.enum(NEWS_TAGS),
  })
  .refine(
    (source) =>
      isOnToolDomain(source.feedUrl, source.officialDomains) &&
      isOnToolDomain(source.homepage, source.officialDomains),
    { message: "The feed and the homepage must be on an official domain." },
  );

export const newsSourcesSchema = z
  .array(newsSourceSchema)
  .min(1)
  .max(40)
  .refine(
    (sources) =>
      new Set(sources.map((source) => source.id)).size === sources.length,
    { message: "Source ids must be unique." },
  )
  .refine(
    (sources) =>
      new Set(sources.map((source) => source.feedUrl)).size === sources.length,
    { message: "Each feed may be listed once." },
  );

export function parseSources(data: unknown): NewsSource[] {
  return newsSourcesSchema.parse(data);
}
