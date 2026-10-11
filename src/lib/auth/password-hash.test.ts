import { afterEach, describe, expect, it } from "vitest";
import {
  PBKDF2_ITERATIONS,
  getPasswordIterations,
  hashPassword,
  setPasswordIterations,
  verifyPassword,
} from "./password-hash";

afterEach(() => {
  // The test setup keeps hashing fast; put that back after each test.
  setPasswordIterations(1_000);
});

describe("password hashing rounds", () => {
  it("is 600,000 by default", async () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000);

    setPasswordIterations(null);
    expect(getPasswordIterations()).toBe(600_000);
    const hashed = await hashPassword("violet lantern ocean");
    expect(hashed.iterations).toBe(600_000);
  });

  it("can be lowered for tests and still verifies", async () => {
    setPasswordIterations(1_000);
    const hashed = await hashPassword("violet lantern ocean");

    expect(hashed.iterations).toBe(1_000);
    expect(await verifyPassword("violet lantern ocean", hashed)).toBe(true);
    expect(await verifyPassword("another password", hashed)).toBe(false);
  });

  it("verifies a hash made with the production count after the default is lowered", async () => {
    setPasswordIterations(null);
    const hashed = await hashPassword("violet lantern ocean");
    setPasswordIterations(1_000);

    expect(await verifyPassword("violet lantern ocean", hashed)).toBe(true);
  });
});
