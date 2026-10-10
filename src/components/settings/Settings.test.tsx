import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Viewer } from "@/lib/auth/get-session";
import { MAX_IMPORT_BYTES } from "@/lib/storage/limits";
import { createMemoryBackend, type KvBackend } from "@/lib/storage/backend";
import { buildBackup } from "@/lib/storage/operations";
import { DEFAULT_SETTINGS, type LocalData } from "@/lib/storage/schemas";
import { createStore } from "@/lib/storage/store";
import { seriousViolations } from "@/test/axe";
import { router } from "@/test/navigation";
import { historyEntry, planNamed, seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { SettingsView } from "./SettingsView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/settings"),
);

const VIEWER: Viewer = {
  name: "Ada Lovelace",
  provider: "github",
  signOutToken: "token-123",
};

function renderSettings(
  backend: KvBackend = createMemoryBackend(),
  viewer: Viewer | null = null,
) {
  const view = render(
    <AppProviders backend={backend}>
      <SettingsView viewer={viewer} version="1.2.3" />
    </AppProviders>,
  );
  return { backend, ...view };
}

async function ready() {
  await screen.findByRole("heading", { level: 1, name: /Settings|सेटिंग/ });
  // Settings load asynchronously; wait until the provider has finished.
  await waitFor(() =>
    expect(screen.getByLabelText("Save search history")).toBeEnabled(),
  );
}

function stored(backend: KvBackend) {
  return createStore(backend).load();
}

function backupFile(data: Partial<LocalData>, name = "backup.json") {
  const full: LocalData = {
    plans: [],
    history: [],
    settings: DEFAULT_SETTINGS,
    ...data,
  };
  return new File([JSON.stringify(buildBackup(full))], name, {
    type: "application/json",
  });
}

beforeEach(() => {
  router.refresh.mockClear();
});

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-motion");
  document.documentElement.lang = "en";
  for (const name of ["theme", "lang"]) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("settings: structure", () => {
  it("has General, Privacy and data, Account and About sections", async () => {
    renderSettings();
    await ready();

    for (const name of ["General", "Privacy and data", "Account", "About"]) {
      expect(
        screen.getByRole("heading", { level: 2, name }),
      ).toBeInTheDocument();
    }
    expect(screen.getByText("Version 1.2.3")).toBeInTheDocument();
  });

  it("gives every setting a label and helper text", async () => {
    renderSettings();
    await ready();

    for (const label of [
      "Language",
      "Theme",
      "Reduce motion",
      "Default plan level",
      "Default budget",
      "Currency display",
      "Save search history",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(
      screen.getByText(/Tool details stay in English/),
    ).toBeInTheDocument();
  });

  it("links to Privacy, the security policy, the repository and feedback", async () => {
    renderSettings();
    await ready();

    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    const external = ["Security policy", "GitHub repository", "Send feedback"];
    for (const name of external) {
      const link = screen.getByRole("link", { name: new RegExp(name) });
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute(
        "href",
        expect.stringContaining("github.com/rishibhaskar777/whichai"),
      );
    }
    expect(screen.getByRole("link", { name: /Send feedback/ })).toHaveAttribute(
      "href",
      expect.stringContaining("template=feedback.yml"),
    );
  });

  it("has no serious accessibility violations", async () => {
    const { container } = renderSettings();
    await ready();
    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("settings: persistence", () => {
  it("applies a theme at once, stores it in a cookie and in the backend", async () => {
    const user = userEvent.setup();
    const { backend } = renderSettings();
    await ready();

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
    await waitFor(async () =>
      expect((await stored(backend)).settings.theme).toBe("dark"),
    );
  });

  it("restores saved settings in a new session", async () => {
    const backend = createMemoryBackend();
    await seed(backend, {
      settings: {
        ...DEFAULT_SETTINGS,
        theme: "dark",
        reduceMotion: "on",
        currencyDisplay: "$",
        saveHistory: false,
      },
    });

    renderSettings(backend);
    await ready();

    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "$" })).toBeChecked();
    expect(screen.getByLabelText("Save search history")).not.toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.motion).toBe("reduce");
  });

  it("keeps the theme the server already showed on a first visit", async () => {
    document.documentElement.dataset.theme = "light";

    renderSettings();
    await ready();

    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("maps Reduce motion to On, Off and System", async () => {
    const user = userEvent.setup();
    renderSettings();
    await ready();
    const group = screen.getByRole("radiogroup", { name: "Reduce motion" });

    await user.click(within(group).getByRole("radio", { name: "On" }));
    expect(document.documentElement.dataset.motion).toBe("reduce");

    await user.click(within(group).getByRole("radio", { name: "Off" }));
    expect(document.documentElement.dataset.motion).toBe("full");

    await user.click(within(group).getByRole("radio", { name: "System" }));
    expect(document.documentElement.dataset.motion).toBeUndefined();
  });

  it("stores the default level and budget", async () => {
    const user = userEvent.setup();
    const { backend } = renderSettings();
    await ready();

    await user.selectOptions(
      screen.getByLabelText("Default plan level"),
      "advanced",
    );
    await user.selectOptions(
      screen.getByLabelText("Default budget"),
      "under-1000",
    );

    await waitFor(async () => {
      const { settings } = await stored(backend);
      expect(settings.defaultLevel).toBe("advanced");
      expect(settings.defaultBudget).toBe("under-1000");
    });
  });

  it("relabels the budget choices when the currency changes", async () => {
    const user = userEvent.setup();
    renderSettings();
    await ready();
    expect(
      screen.getByRole("option", { name: "Under ₹1,000" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "$" }));

    expect(
      screen.getByRole("option", { name: "Under $12" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Under ₹1,000" }),
    ).not.toBeInTheDocument();
  });

  it("turns search history off and remembers it", async () => {
    const user = userEvent.setup();
    const { backend } = renderSettings();
    await ready();

    await user.click(screen.getByLabelText("Save search history"));

    await waitFor(async () =>
      expect((await stored(backend)).settings.saveHistory).toBe(false),
    );
  });
});

describe("settings: language", () => {
  it("switches to Hindi: strings, lang attribute, cookie and a server refresh", async () => {
    const user = userEvent.setup();
    const { backend } = renderSettings();
    await ready();

    await user.click(screen.getByRole("radio", { name: "हिन्दी" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "सेटिंग" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "सामान्य" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("hi");
    expect(document.cookie).toContain("lang=hi");
    expect(router.refresh).toHaveBeenCalled();
    await waitFor(async () =>
      expect((await stored(backend)).settings.language).toBe("hi"),
    );
  });

  it("switches back to English", async () => {
    const user = userEvent.setup();
    renderSettings();
    await ready();
    await user.click(screen.getByRole("radio", { name: "हिन्दी" }));
    await screen.findByRole("heading", { level: 1, name: "सेटिंग" });

    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Settings" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("renders Hindi when the page starts in Hindi", async () => {
    render(
      <AppProviders locale="hi">
        <SettingsView viewer={null} version="1.2.3" />
      </AppProviders>,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "सेटिंग" }),
    ).toBeInTheDocument();
    expect(screen.getByText("संस्करण 1.2.3")).toBeInTheDocument();
  });
});

describe("settings: account", () => {
  it("offers Sign in when signed out", async () => {
    renderSettings();
    await ready();

    expect(screen.getByText(/You are not signed in/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the name and provider with a CSRF-protected Sign out", async () => {
    const { container } = renderSettings(createMemoryBackend(), VIEWER);
    await ready();

    expect(
      screen.getByText("Signed in as Ada Lovelace with GitHub."),
    ).toBeInTheDocument();
    const form = container.querySelector(
      'form[action="/api/auth/sign-out"]',
    ) as HTMLFormElement;
    expect(form).toHaveAttribute("method", "post");
    expect(form.querySelector('input[name="csrf"]')).toHaveValue("token-123");
    expect(
      within(form).getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
  });
});

describe("settings: export", () => {
  it("downloads all local data as one JSON file", async () => {
    const user = userEvent.setup();
    const backend = createMemoryBackend();
    const plan = planNamed("Exported plan");
    await seed(backend, {
      plans: [plan],
      history: [historyEntry("study plan", new Date())],
    });
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:test");
    vi.stubGlobal(
      "URL",
      Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }),
    );
    let fileName = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      fileName = this.download;
    });
    renderSettings(backend);
    await ready();
    await waitFor(() =>
      expect(screen.getByLabelText("Save search history")).toBeEnabled(),
    );

    await user.click(screen.getByRole("button", { name: "Export my data" }));

    expect(fileName).toMatch(/^whichai-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const content = JSON.parse(await blob.text());
    expect(content.app).toBe("whichai");
    expect(content.plans.map((p: { title: string }) => p.title)).toEqual([
      "Exported plan",
    ]);
    expect(content.history).toHaveLength(1);
    expect(content.settings).toBeDefined();
  });
});

describe("settings: import", () => {
  async function chooseFile(file: File) {
    const user = userEvent.setup();
    await user.upload(screen.getByLabelText("Choose a backup file"), file);
    return user;
  }

  it("rejects a file of the wrong shape", async () => {
    renderSettings();
    await ready();

    await chooseFile(new File(['{"hello":"world"}'], "x.json"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "not a WhichAI backup",
    );
    expect(
      screen.queryByRole("button", { name: "Import" }),
    ).not.toBeInTheDocument();
  });

  it("rejects text that is not JSON", async () => {
    renderSettings();
    await ready();

    await chooseFile(new File(["<html></html>"], "x.json"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "not a valid backup",
    );
  });

  it("rejects a file over 1 MB without reading it", async () => {
    renderSettings();
    await ready();
    const big = new File(["x".repeat(MAX_IMPORT_BYTES + 1)], "big.json");
    const read = vi.spyOn(big, "text");

    await chooseFile(big);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "larger than 1 MB",
    );
    expect(read).not.toHaveBeenCalled();
  });

  it("previews the counts and skipped items before importing", async () => {
    renderSettings();
    await ready();
    const file = backupFile({ plans: [planNamed("Imported")], history: [] });
    const raw = JSON.parse(await file.text());
    raw.plans.push({ id: "bad" });

    await chooseFile(new File([JSON.stringify(raw)], "x.json"));

    expect(
      await screen.findByText(
        /This file contains: 1 saved plan, your settings\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 item in the file was not valid/),
    ).toBeInTheDocument();
  });

  it("merges by default, keeping what is already here", async () => {
    const backend = createMemoryBackend();
    await seed(backend, { plans: [planNamed("Already here")] });
    renderSettings(backend);
    await ready();
    const user = await chooseFile(
      backupFile({ plans: [planNamed("From file")] }),
    );
    await screen.findByText(/This file contains/);
    expect(
      screen.getByRole("radio", { name: /Merge with what is here/ }),
    ).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByText("Import finished.")).toBeInTheDocument();
    const { plans } = await stored(backend);
    expect(plans.map((plan) => plan.title).sort()).toEqual([
      "Already here",
      "From file",
    ]);
  });

  it("replaces only after the person confirms", async () => {
    const backend = createMemoryBackend();
    await seed(backend, { plans: [planNamed("Already here")] });
    renderSettings(backend);
    await ready();
    const user = await chooseFile(
      backupFile({ plans: [planNamed("From file")] }),
    );
    await screen.findByText(/This file contains/);
    await user.click(
      screen.getByRole("radio", { name: /Replace what is here/ }),
    );

    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(
      screen.getByRole("heading", {
        name: "Replace your data with this file?",
      }),
    ).toBeInTheDocument();
    expect((await stored(backend)).plans.map((p) => p.title)).toEqual([
      "Already here",
    ]);

    await user.click(screen.getByRole("button", { name: "Replace my data" }));

    expect(await screen.findByText("Import finished.")).toBeInTheDocument();
    expect((await stored(backend)).plans.map((p) => p.title)).toEqual([
      "From file",
    ]);
  });

  it("shows file contents as text, never as markup", async () => {
    renderSettings();
    await ready();
    const evil = backupFile({
      plans: [planNamed("<img src=x onerror=alert(1)>")],
    });

    const user = await chooseFile(evil);
    await screen.findByText(/This file contains/);
    await user.click(screen.getByRole("button", { name: "Import" }));
    await screen.findByText("Import finished.");

    expect(document.querySelector("img")).toBeNull();
  });
});

describe("settings: clear all data", () => {
  it("needs CLEAR typed before it will delete anything", async () => {
    const user = userEvent.setup();
    const backend = createMemoryBackend();
    await seed(backend, {
      plans: [planNamed("Keep me")],
      history: [historyEntry("study plan", new Date())],
      settings: { ...DEFAULT_SETTINGS, theme: "dark" },
    });
    renderSettings(backend);
    await ready();

    await user.click(screen.getByRole("button", { name: "Clear all data" }));
    const confirm = screen.getByRole("button", { name: "Clear everything" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/Type CLEAR to confirm/), "clear");
    expect(confirm).toBeDisabled();

    await user.clear(screen.getByLabelText(/Type CLEAR to confirm/));
    await user.type(screen.getByLabelText(/Type CLEAR to confirm/), "CLEAR");
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(
      await screen.findByText("All data on this device was cleared."),
    ).toBeInTheDocument();
    const after = await stored(backend);
    expect(after.plans).toEqual([]);
    expect(after.history).toEqual([]);
    expect(after.settingsStored).toBe(false);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("keeps everything when cancelled", async () => {
    const user = userEvent.setup();
    const backend = createMemoryBackend();
    await seed(backend, { plans: [planNamed("Keep me")] });
    renderSettings(backend);
    await ready();

    await user.click(screen.getByRole("button", { name: "Clear all data" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect((await stored(backend)).plans).toHaveLength(1);
  });
});

describe("settings: storage unavailable", () => {
  function blockAllStorage() {
    vi.stubGlobal("indexedDB", undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
  }

  it("still works for the visit and says so gently", async () => {
    blockAllStorage();
    const user = userEvent.setup();
    render(
      <AppProviders realStorage>
        <SettingsView viewer={null} version="1.2.3" />
      </AppProviders>,
    );
    await ready();

    expect(
      await screen.findByText(/Your browser is blocking storage/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await user.click(screen.getByLabelText("Save search history"));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByLabelText("Save search history")).not.toBeChecked();
  });

  it("raises no notice when localStorage is a working fallback", async () => {
    vi.stubGlobal("indexedDB", undefined);
    render(
      <AppProviders realStorage>
        <SettingsView viewer={null} version="1.2.3" />
      </AppProviders>,
    );
    await ready();

    expect(
      screen.queryByText(/Your browser is blocking storage/),
    ).not.toBeInTheDocument();
    window.localStorage.clear();
  });
});

describe("settings: subscription", () => {
  it("shows the current plan, its price and what it includes", async () => {
    renderSettings();
    await ready();

    const section = document.getElementById("subscription") as HTMLElement;
    expect(section).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { level: 2, name: "Subscription" }),
    ).toBeInTheDocument();
    expect(within(section).getByText("Free plan")).toBeInTheDocument();
    expect(within(section).getByText("₹0 a month")).toBeInTheDocument();
    expect(within(section).getByText("PDF export")).toBeInTheDocument();
    expect(within(section).getByText("Share links")).toBeInTheDocument();
    expect(
      within(section).queryByText("Change alerts"),
    ).not.toBeInTheDocument();
  });

  it("links View plans to /pricing", async () => {
    renderSettings();
    await ready();

    expect(screen.getByRole("link", { name: "View plans" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });

  it("opens the coming-soon dialog from Manage subscription", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    renderSettings();
    await ready();

    const dialog = [...document.querySelectorAll("dialog")].find((element) =>
      element.textContent?.includes("Payments are coming"),
    ) as HTMLDialogElement;
    await user.click(
      screen.getByRole("button", { name: "Manage subscription" }),
    );

    expect(dialog).toHaveAttribute("open");
    expect(
      within(dialog).getByText(/Payments are coming in an upcoming update/),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
  });

  it("links Terms, Refund policy and Contact from About", async () => {
    renderSettings();
    await ready();

    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(screen.getByRole("link", { name: "Refund policy" })).toHaveAttribute(
      "href",
      "/refund-policy",
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
