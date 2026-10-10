import { describe, expect, it, vi } from "vitest";
import { fetchFeedText, MAX_RESPONSE_BYTES } from "./fetch-feed";

function respond(body: string | ArrayBuffer, init?: ResponseInit) {
  return vi.fn(async () => new Response(body, { status: 200, ...init }));
}

describe("fetchFeedText", () => {
  it("returns the body of a 200 response", async () => {
    const fetchImpl = respond("<rss></rss>");
    expect(
      await fetchFeedText("https://example.com/feed.xml", { fetchImpl }),
    ).toBe("<rss></rss>");
  });

  it("asks for the exact address, without following redirects or caching", async () => {
    const fetchImpl = respond("<rss></rss>");
    await fetchFeedText("https://example.com/feed.xml", { fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://example.com/feed.xml");
    expect(init.redirect).toBe("manual");
    expect(init.cache).toBe("no-store");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("refuses an address that is not https", async () => {
    const fetchImpl = respond("<rss></rss>");
    await expect(
      fetchFeedText("http://example.com/feed.xml", { fetchImpl }),
    ).rejects.toThrow("not https");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails on redirects and error statuses", async () => {
    await expect(
      fetchFeedText("https://example.com/feed.xml", {
        fetchImpl: respond("", { status: 301 }),
      }),
    ).rejects.toThrow("HTTP 301");
    await expect(
      fetchFeedText("https://example.com/feed.xml", {
        fetchImpl: respond("", { status: 503 }),
      }),
    ).rejects.toThrow("HTTP 503");
  });

  it("stops reading at the size limit", async () => {
    const big = new Uint8Array(3 * MAX_RESPONSE_BYTES).fill(97).buffer;
    const text = await fetchFeedText("https://example.com/feed.xml", {
      fetchImpl: respond(big),
    });
    expect(text.length).toBe(MAX_RESPONSE_BYTES);
  });

  it("times out", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    ) as unknown as typeof fetch;
    await expect(
      fetchFeedText("https://example.com/feed.xml", {
        fetchImpl,
        timeoutMs: 20,
      }),
    ).rejects.toThrow("aborted");
  });
});
