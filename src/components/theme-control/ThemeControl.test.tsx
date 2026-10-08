import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeControl } from "./ThemeControl";

afterEach(() => {
  delete document.documentElement.dataset.theme;
  document.cookie = "theme=; Max-Age=0; Path=/";
});

describe("ThemeControl", () => {
  it("offers System, Light and Dark and starts on the server choice", () => {
    render(<ThemeControl initialChoice="system" compact={false} />);

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
  });

  it("applies and stores an explicit theme", async () => {
    const user = userEvent.setup();
    render(<ThemeControl initialChoice="system" compact={false} />);

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
  });

  it("returns to the system setting and clears the cookie", async () => {
    const user = userEvent.setup();
    render(<ThemeControl initialChoice="system" compact={false} />);
    await user.click(screen.getByRole("radio", { name: "Light" }));

    await user.click(screen.getByRole("radio", { name: "System" }));

    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.cookie).not.toContain("theme=light");
  });

  it("keeps option names available in compact mode", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeControl initialChoice="light" compact />);

    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
  });
});
