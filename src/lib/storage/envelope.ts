import { SCHEMA_VERSION } from "./limits";

/** Upgrades data written at one version to the next. */
export type Migrations = Readonly<Record<number, (data: unknown) => unknown>>;

/** Add an entry here, keyed by the version it upgrades from, when a schema changes. */
export const MIGRATIONS: Migrations = {};

export function serialize(data: unknown): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, data });
}

/**
 * Returns the stored data upgraded to `current`, or null when the text is
 * not an envelope, is newer than this app understands, or cannot be upgraded.
 */
export function readEnvelope(
  raw: string | null,
  current: number = SCHEMA_VERSION,
  migrations: Migrations = MIGRATIONS,
): unknown {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const { schemaVersion, data } = parsed as {
    schemaVersion?: unknown;
    data?: unknown;
  };
  if (!Number.isInteger(schemaVersion)) return null;

  let version = schemaVersion as number;
  if (version < 1 || version > current) return null;
  let upgraded = data;
  try {
    while (version < current) {
      const migrate = migrations[version];
      if (!migrate) return null;
      upgraded = migrate(upgraded);
      version += 1;
    }
  } catch {
    return null;
  }
  return upgraded ?? null;
}
