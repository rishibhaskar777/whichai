import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogue } from "@/data/catalogue";
import { createI18n } from "@/lib/i18n/translate";
import {
  DEFAULT_QUERY,
  PAGE_SIZE,
  parseLibraryQuery,
} from "@/lib/library/query";
import { toolDetails } from "@/lib/library/tool-details";
import type { Visitor } from "@/lib/platform";
import type { GetIt as GetItData } from "@/lib/schemas/catalogue";
import { seriousViolations } from "@/test/axe";
import { CompareView } from "./CompareView";
import { GetIt } from "./GetIt";
import { Library } from "./Library";
import { ToolDetail } from "./ToolDetail";

const visitor: { current: Visitor } = {
  current: { system: null, browser: null },
};

vi.mock("@/lib/use-visitor", () => ({
  useVisitor: () => visitor.current,
}));

const i18n = createI18n("en");

const GET_IT: GetItData = {
  web: { url: "https://example.com", linkCheckedOn: "2026-10-10" },
  windows: { url: "https://example.com/win", linkCheckedOn: null },
  macos: { url: "https://example.com/mac", linkCheckedOn: null },
  android: {
    url: "https://play.google.com/store/apps/details?id=x",
    linkCheckedOn: null,
  },
  cliInstall: "npm install -g example",
};

beforeEach(() => {
  visitor.current = { system: null, browser: null };
});

describe("GetIt", () => {
  it("falls back to the official site when there are no links", () => {
    render(
      <GetIt
        toolName="Example"
        getIt={undefined}
        officialUrl="https://example.com"
      />,
    );
    const link = screen.getByRole("link", {
      name: /Find downloads on the official site/,
    });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText(/check the address bar/i)).toBeInTheDocument();
  });

  it("opens every link in a new tab without a referrer or opener", () => {
    render(
      <GetIt
        toolName="Example"
        getIt={GET_IT}
        officialUrl="https://example.com"
      />,
    );
    const links = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("https://"));
    expect(links.length).toBeGreaterThan(3);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
  });

  it("puts the visitor's platform first and highlights it", () => {
    visitor.current = { system: "macos", browser: null };
    render(
      <GetIt
        toolName="Example"
        getIt={GET_IT}
        officialUrl="https://example.com"
      />,
    );
    const items = screen.getAllByRole("listitem");
    const first = within(items[0]!).getByRole("link");
    expect(first).toHaveTextContent("macOS");
    expect(first).toHaveAttribute("data-current", "true");
    expect(screen.getByRole("link", { name: /Windows/ })).not.toHaveAttribute(
      "data-current",
    );
  });

  it("keeps a stable order when the platform is not known", () => {
    render(
      <GetIt
        toolName="Example"
        getIt={GET_IT}
        officialUrl="https://example.com"
      />,
    );
    const labels = screen
      .getAllByRole("link")
      .map((link) => link.textContent ?? "");
    expect(labels[0]).toMatch(/Open on the web/);
    expect(labels[1]).toMatch(/Windows/);
  });

  it("says which links have not been checked", () => {
    render(
      <GetIt
        toolName="Example"
        getIt={GET_IT}
        officialUrl="https://example.com"
      />,
    );
    expect(screen.getAllByText("Link not verified yet")).toHaveLength(3);
    expect(screen.getByText(/Link checked 10 Oct 2026/)).toBeInTheDocument();
  });

  it("shows an install command as copyable text and never runs it", () => {
    render(
      <GetIt
        toolName="Example"
        getIt={GET_IT}
        officialUrl="https://example.com"
      />,
    );
    expect(screen.getByText("npm install -g example").tagName).toBe("CODE");
    expect(
      screen.getByRole("button", {
        name: "Copy the install command for Example",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Shown as text only/)).toBeInTheDocument();
  });

  it("shows one best button and a link to the rest in the compact form", () => {
    visitor.current = { system: "android", browser: null };
    render(
      <GetIt
        toolName="Example"
        getIt={GET_IT}
        officialUrl="https://example.com"
        variant="compact"
        detailHref="/tools/example"
      />,
    );
    const external = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("target") === "_blank");
    expect(external).toHaveLength(1);
    expect(external[0]).toHaveTextContent("Android");
    expect(
      screen.getByRole("link", { name: "More ways to get it" }),
    ).toHaveAttribute("href", "/tools/example#get-it");
  });

  it("uses the browser store link that matches the visitor's browser", () => {
    visitor.current = { system: "windows", browser: "firefox" };
    const getIt: GetItData = {
      ...GET_IT,
      chromeExtension: {
        url: "https://chromewebstore.google.com/detail/x/abc",
        linkCheckedOn: null,
      },
      firefoxAddon: {
        url: "https://addons.mozilla.org/firefox/addon/x/",
        linkCheckedOn: null,
      },
    };
    render(
      <GetIt
        toolName="Example"
        getIt={getIt}
        officialUrl="https://example.com"
      />,
    );
    const labels = screen
      .getAllByRole("link")
      .map((link) => link.textContent ?? "");
    expect(labels[0]).toMatch(/Windows/);
    expect(labels[1]).toMatch(/Firefox add-on/);
  });

  it("has no serious accessibility problems", async () => {
    const { container } = render(
      <GetIt
        toolName="Example"
        getIt={GET_IT}
        officialUrl="https://example.com"
      />,
    );
    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("Library", () => {
  function renderLibrary(params: Record<string, string> = {}) {
    return render(
      <Library
        catalogue={catalogue}
        query={parseLibraryQuery(params)}
        i18n={i18n}
      />,
    );
  }

  it("lists a first page of tools and says how many there are", () => {
    renderLibrary();
    expect(
      screen.getByRole("heading", { level: 1, name: "Tool Library" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(PAGE_SIZE);
    expect(
      screen.getByText(`${catalogue.tools.length} tools`, {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Pages" }),
    ).toBeInTheDocument();
  });

  it("applies the filters from the URL and keeps them in the form", () => {
    renderLibrary({ kind: "cli", platform: "linux" });
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(catalogue.tools.length);
    expect(screen.getByRole("combobox", { name: "Kind" })).toHaveValue("cli");
    expect(screen.getByRole("combobox", { name: "Platform" })).toHaveValue(
      "linux",
    );
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/tools",
    );
  });

  it("shows an empty state with a way back", () => {
    renderLibrary({ q: "zzzz-nothing-matches" });
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(
      screen.getByRole("heading", { name: "No tools match" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/0 tools of 298 match/)).toBeInTheDocument();
  });

  it("shows platform icons, jobs, the free badge and verification on a card", () => {
    renderLibrary({ q: "ollama" });
    const card = screen.getByRole("article", { name: /Ollama/ });
    expect(within(card).getByText("Free option")).toBeInTheDocument();
    expect(within(card).getByText("Not verified")).toBeInTheDocument();
    expect(
      within(card).getByRole("list", { name: "Available on" }),
    ).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: "Run AI on your own computer" }),
    ).toHaveAttribute("href", "/tools?job=run-ai-locally");
  });

  it("puts a tool into the comparison through the URL", () => {
    renderLibrary({ q: "ollama" });
    const card = screen.getByRole("article", { name: /Ollama/ });
    const add = within(card).getByRole("link", { name: /Compare/ });
    expect(add.getAttribute("href")).toContain("compare=ollama");
  });

  it("shows the comparison tray and stops offering a fourth tool", () => {
    renderLibrary({ compare: "ollama,git,claude" });
    expect(
      screen.getByRole("link", { name: "Compare these tools" }),
    ).toHaveAttribute("href", "/compare?tools=ollama,git,claude");
    expect(
      screen.getAllByText("Comparison is full (3 tools)").length,
    ).toBeGreaterThan(0);
  });

  it("has no serious accessibility problems", async () => {
    const { container } = renderLibrary({ kind: "model" });
    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("ToolDetail", () => {
  function renderDetail(id: string) {
    return render(
      <ToolDetail details={toolDetails(id, catalogue)!} i18n={i18n} />,
    );
  }

  it("shows the facts, the alternatives and the honest status", () => {
    renderDetail("ollama");
    expect(
      screen.getByRole("heading", { level: 1, name: "Ollama" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sample data, not verified")).toBeInTheDocument();
    expect(screen.getByText(/\[verify\]/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Alternatives" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Get it" })).toBeInTheDocument();
    expect(
      screen.getByText(/curl -fsSL https:\/\/ollama.com/),
    ).toBeInTheDocument();
  });

  it("links to a prefilled problem report with the tool id in the title", () => {
    renderDetail("ollama");
    const link = screen.getByRole("link", {
      name: /Report a problem with this tool/,
    });
    const url = new URL(link.getAttribute("href")!);
    expect(url.origin + url.pathname).toMatch(/\/issues\/new$/);
    expect(url.searchParams.get("title")).toBe("Tool problem: ollama");
    expect(url.searchParams.get("tool")).toBe("ollama");
  });

  it("links the official site, and compare with the tool selected", () => {
    renderDetail("ollama");
    expect(screen.getByRole("link", { name: /Official page/ })).toHaveAttribute(
      "href",
      "https://ollama.com",
    );
    expect(
      screen.getByRole("link", { name: "Compare with other tools" }),
    ).toHaveAttribute("href", "/compare?tools=ollama");
  });

  it("has a single h1 and no serious accessibility problems", async () => {
    const { container } = renderDetail("claude");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("CompareView", () => {
  function renderCompare(selected: string[], unmatched: string | null = null) {
    return render(
      <CompareView
        catalogue={catalogue}
        selected={selected}
        unmatched={unmatched}
        i18n={i18n}
      />,
    );
  }

  it("shows one column per tool with the rows asked for", () => {
    renderCompare(["ollama", "lm-studio", "jan"]);
    const table = screen.getByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Ollama", "LM Studio", "Jan"]);
    for (const row of [
      "Kind",
      "Jobs",
      "Free option",
      "Pricing",
      "Platforms",
      "Strengths",
      "Watch out for",
      "Works with",
      "Verification",
      "Get it",
    ]) {
      expect(
        within(table).getByRole("rowheader", { name: row }),
      ).toBeInTheDocument();
    }
  });

  it("lets a tool be removed through the URL", () => {
    renderCompare(["ollama", "jan"]);
    const remove = screen.getByRole("link", { name: /Remove\s*Ollama/ });
    expect(remove).toHaveAttribute("href", "/compare?tools=jan");
  });

  it("hides the add form when three tools are picked", () => {
    renderCompare(["ollama", "lm-studio", "jan"]);
    expect(screen.queryByRole("combobox", { name: "Add a tool" })).toBeNull();
    expect(screen.getByText(/picked three tools/)).toBeInTheDocument();
  });

  it("offers every unpicked tool as a suggestion", () => {
    const { container } = renderCompare(["ollama"]);
    const options = container.querySelectorAll("datalist option");
    expect(options).toHaveLength(catalogue.tools.length - 1);
    expect(
      screen.getByRole("combobox", { name: "Add a tool" }),
    ).toHaveAttribute("list", "compare-suggestions");
  });

  it("shows an empty state and a message for text that matched nothing", () => {
    renderCompare([], "frobnicate");
    expect(
      screen.getByRole("heading", { name: "Nothing to compare yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("frobnicate");
  });

  it("keeps the default query unchanged for an empty comparison", () => {
    expect(DEFAULT_QUERY.compare).toEqual([]);
  });

  it("has no serious accessibility problems", async () => {
    const { container } = renderCompare(["ollama", "jan"]);
    expect(await seriousViolations(container)).toEqual([]);
  });
});
