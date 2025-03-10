import React from "react";
import { describe, it, expect, vi } from "vitest";
import { Checkbox } from "../checkbox";
import { render, screen } from "../../../test";

describe("Checkbox", () => {
  describe("Component Variants", () => {
    it("applies warning variant styles correctly", async () => {
      await render(<Checkbox variant="warning" label="Warning Checkbox" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("ui-border-warning");
    });

    it("applies destructive variant styles correctly", async () => {
      await render(
        <Checkbox variant="destructive" label="Destructive Checkbox" />,
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("ui-border-destructive");
    });
  });

  it("renders in unchecked state by default", async () => {
    await render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });

  it("renders with provided label", async () => {
    await render(<Checkbox label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
  });

  it("changes state when clicked", async () => {
    const handleChange = vi.fn();
    const { user } = await render(<Checkbox onChange={handleChange} />);

    await user.click(screen.getByRole("checkbox"));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("responds to keyboard interactions", async () => {
    const handleChange = vi.fn();
    const { user } = await render(
      <Checkbox onChange={handleChange} label="Keyboard test" />,
    );
    const checkbox = screen.getByRole("checkbox");

    // Focus and press Enter
    await user.tab();
    expect(checkbox).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(handleChange).toHaveBeenCalledWith(true);

    // Press Space
    await user.keyboard(" ");
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("prevents interaction when disabled", async () => {
    const handleChange = vi.fn();
    const { user } = await render(
      <Checkbox disabled onChange={handleChange} label="Disabled checkbox" />,
    );
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).toHaveAttribute("aria-disabled", "true");
    await user.click(checkbox);
    expect(handleChange).not.toHaveBeenCalled();

    // Should not be focusable
    await user.tab();
    expect(checkbox).not.toHaveFocus();
  });

  describe("accessibility", () => {
    it("maintains proper ARIA attributes", async () => {
      await render(<Checkbox label="Accessibility test" checked={true} />);
      const checkbox = screen.getByRole("checkbox");

      expect(checkbox).toHaveAttribute("aria-checked", "true");
      expect(checkbox).toHaveAttribute("role", "checkbox");

      const label = screen.getByText("Accessibility test");
      expect(checkbox).toHaveAttribute("aria-labelledby", label.id);
    });

    it("supports keyboard navigation", async () => {
      const { user } = await render(
        <>
          <Checkbox label="First checkbox" />
          <Checkbox label="Second checkbox" />
        </>,
      );

      // Tab to first checkbox
      await user.tab();
      expect(screen.getByText("First checkbox").previousSibling).toHaveFocus();

      // Tab to second checkbox
      await user.tab();
      expect(screen.getByText("Second checkbox").previousSibling).toHaveFocus();
    });
  });
});
