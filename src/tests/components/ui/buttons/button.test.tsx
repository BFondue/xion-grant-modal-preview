import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../..";
import { Button } from "../../../../components/ui/buttons/button";

describe("Button", () => {
  describe("rendering", () => {
    it("renders children correctly", async () => {
      await render(<Button>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("renders as a button element", async () => {
      await render(<Button>Test</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("structure variants", () => {
    it("applies base structure styles by default", async () => {
      await render(<Button>Base Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-bg-white");
      expect(button).toHaveClass("ui-text-black");
    });

    it("applies outlined structure styles", async () => {
      await render(<Button structure="outlined">Outlined Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-border");
      expect(button).toHaveClass("ui-bg-transparent");
      expect(button).toHaveClass("ui-text-white");
    });

    it("applies naked structure styles", async () => {
      await render(<Button structure="naked">Naked Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-border-none");
      expect(button).toHaveClass("ui-bg-transparent");
      expect(button).toHaveClass("ui-underline");
    });

    it("applies destructive structure styles", async () => {
      await render(<Button structure="destructive">Destructive Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-bg-red-500");
      expect(button).toHaveClass("ui-text-white");
    });

    it("applies destructive-outline structure styles", async () => {
      await render(
        <Button structure="destructive-outline">Destructive Outline</Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-border");
      expect(button).toHaveClass("ui-border-red-500");
      expect(button).toHaveClass("ui-text-red-500");
    });
  });

  describe("disabled state", () => {
    it("applies disabled base styles", async () => {
      await render(<Button disabled>Disabled Base</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-bg-disabled-bg");
      expect(button).toHaveClass("ui-text-disabled-text");
      expect(button).toHaveClass("ui-pointer-events-none");
    });

    it("applies disabled outlined styles", async () => {
      await render(
        <Button disabled structure="outlined">
          Disabled Outlined
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-bg-transparent");
      expect(button).toHaveClass("ui-border-neutral-600");
      expect(button).toHaveClass("ui-text-neutral-600");
      expect(button).toHaveClass("ui-pointer-events-none");
    });

    it("applies disabled naked styles", async () => {
      await render(
        <Button disabled structure="naked">
          Disabled Naked
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-border-none");
      expect(button).toHaveClass("ui-bg-transparent");
      expect(button).toHaveClass("ui-text-white/60");
      expect(button).toHaveClass("ui-pointer-events-none");
    });

    it("applies disabled destructive styles", async () => {
      await render(
        <Button disabled structure="destructive">
          Disabled Destructive
        </Button>,
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-bg-red-500/60");
      expect(button).toHaveClass("ui-pointer-events-none");
    });
  });

  describe("fullWidth prop", () => {
    it("does not apply full width by default", async () => {
      await render(<Button>Not Full Width</Button>);
      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("ui-w-full");
    });

    it("applies full width when prop is true", async () => {
      await render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-w-full");
    });
  });

  describe("onClick handler", () => {
    it("calls onClick when clicked", async () => {
      const handleClick = vi.fn();
      const { user } = await render(
        <Button onClick={handleClick}>Clickable</Button>,
      );

      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("passes event to onClick handler", async () => {
      const handleClick = vi.fn();
      const { user } = await render(
        <Button onClick={handleClick}>Clickable</Button>,
      );

      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("custom className", () => {
    it("applies custom className", async () => {
      await render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("merges custom className with default classes", async () => {
      await render(<Button className="my-custom-class">Merged</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("my-custom-class");
      expect(button).toHaveClass("ui-flex");
      expect(button).toHaveClass("ui-items-center");
    });
  });

  describe("additional props", () => {
    it("passes through additional HTML attributes", async () => {
      await render(
        <Button data-testid="test-button" aria-label="Test button">
          Props Test
        </Button>,
      );
      const button = screen.getByTestId("test-button");
      expect(button).toHaveAttribute("aria-label", "Test button");
    });

    it("supports type attribute", async () => {
      await render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  describe("default styling", () => {
    it("has flex layout classes", async () => {
      await render(<Button>Flex</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-flex");
      expect(button).toHaveClass("ui-items-center");
      expect(button).toHaveClass("ui-justify-center");
    });

    it("has rounded corners", async () => {
      await render(<Button>Rounded</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-rounded-lg");
    });

    it("has uppercase text", async () => {
      await render(<Button>Uppercase</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("ui-uppercase");
    });
  });
});
