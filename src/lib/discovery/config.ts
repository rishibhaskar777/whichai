import { z } from "zod";

const count = z.number().int().min(0);
const words = z.array(z.string().min(1).max(40)).min(1).max(80);

export const configSchema = z.strictObject({
  minAgeDays: count.min(1),
  maxNewIssuesPerRun: count.min(1).max(25),
  maxSignalAgeDays: count.min(1),
  maxRefreshLookups: count.max(100),
  moderate: z.strictObject({
    githubStars: count,
    githubStarGrowth: count,
    hfLikes: count,
    hfDownloads: count,
    hnPoints: count,
    independentSources: count.min(2),
  }),
  strong: z.strictObject({
    githubStars: count,
    githubStarGrowth: count,
    hfLikes: count,
    hfDownloads: count,
    hnPoints: count,
  }),
  required: z.strictObject({
    strongSignals: count.min(1),
    moderateSignals: count.min(1),
  }),
  watchlist: z.strictObject({
    maxTracked: count.min(1).max(300),
    /** GitHub's issue body limit is 65,536 characters. */
    maxBodyChars: count.min(1000).max(64000),
    expireAfterDays: count.min(1),
    reAddAfterDays: count.min(1),
    summaryRows: count.min(1).max(50),
  }),
  github: z.strictObject({
    topics: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .min(1)
      .max(8),
    createdWithinDays: count.min(1),
    perQuery: count.min(1).max(100),
    minStars: count,
    minStarsPerDay: z.number().min(0),
    toolWords: words,
    excludeWords: words,
  }),
  huggingface: z.strictObject({
    createdWithinDays: count.min(1),
    perList: count.min(1).max(100),
    minLikes: count,
    minDownloads: count,
    keepTop: count.min(1).max(100),
    individualMinLikes: count,
    maxOrganisationLookups: count.max(100),
    derivativeTagPrefixes: words,
    derivativeTags: words,
    derivativeNameWords: words,
  }),
  hackernews: z.strictObject({
    queries: z.array(z.string().min(1).max(40)).min(1).max(8),
    withinDays: count.min(1),
    perQuery: count.min(1).max(100),
    minPoints: count,
    minComments: count,
  }),
  news: z.strictObject({
    withinDays: count.min(1),
  }),
});
export type DiscoveryConfig = z.infer<typeof configSchema>;

export const rejectedSchema = z.strictObject({
  names: z.array(z.string().min(1).max(60)),
  domains: z.array(z.string().min(3).max(80)),
});
export type RejectedList = z.infer<typeof rejectedSchema>;

export function parseConfig(value: unknown): DiscoveryConfig {
  return configSchema.parse(value);
}

export function parseRejected(value: unknown): RejectedList {
  return rejectedSchema.parse(value);
}
