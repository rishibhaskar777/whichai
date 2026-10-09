import { vi } from "vitest";

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
};

export const searchParams = { current: new URLSearchParams() };

/** A stand-in for next/navigation. Use inside vi.mock with a dynamic import. */
export function navigationMock(pathname: string) {
  return {
    usePathname: () => pathname,
    useRouter: () => router,
    useSearchParams: () => searchParams.current,
  };
}
