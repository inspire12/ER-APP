import { describe, expect, it } from "vitest";
import { createPatientToken, hashPatientToken } from "../../src/lib/token";

describe("patient token", () => {
  it("creates an unpredictable URL-safe token", () => {
    const first = createPatientToken();
    const second = createPatientToken();
    expect(first).toHaveLength(32);
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("stores a one-way hash instead of the original token", () => {
    const token = createPatientToken();
    const hash = hashPatientToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    expect(hashPatientToken(token)).toBe(hash);
  });
});
