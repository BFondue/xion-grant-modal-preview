import React from "react";
import { describe, it, expect } from "vitest";
import { BaseButton } from "../../../../components/ui/buttons/baseButton";
import {
  render,
  screen,
  testButtonComponent,
  testRefForwarding,
  testComponentVariants,
} from "../../..";

describe("BaseButton", () => {
  // Test common button behavior
  testButtonComponent(BaseButton, {}, "Click me");

  // Test ref forwarding
  testRefForwarding(BaseButton, { children: "Button" }, HTMLButtonElement);

  // Test variants
  testComponentVariants(
    BaseButton,
    { children: "Test" },
    {
      default: ["ui-bg-white", "ui-text-black"],
      secondary: ["ui-border", "ui-border-border"],
      destructive: [
        "ui-bg-transparent",
        "ui-text-destructive",
        "ui-border",
        "ui-border-destructive",
      ],
    },
  );

  // Test sizes
  it("applies different sizes correctly", async () => {
    const { rerender } = await render(
      <BaseButton size="large">Large</BaseButton>,
    );
    expect(screen.getByText("Large")).toHaveClass("ui-h-[52px]");

    rerender(<BaseButton size="small">Small</BaseButton>);
    expect(screen.getByText("Small")).toHaveClass("ui-h-10");
  });

  it("renders back arrow when specified", async () => {
    await render(<BaseButton backArrow>Back</BaseButton>);
    const icon = screen.getByTestId("chevron-right-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("ui-rotate-180");
  });
});
