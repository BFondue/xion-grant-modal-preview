import React from "react";
import { describe, it, expect } from "vitest";
import { Accordion, AccordionItem } from "../../../components/ui/accordion";
import { testCommonComponentProps } from "../..";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("AccordionItem", () => {
  // Test common component props
  testCommonComponentProps(
    AccordionItem,
    { title: "Test Accordion" },
    "accordion-item",
  );

  it("renders title correctly", async () => {
    await render(
      <AccordionItem title="Test Title" data-testid="accordion-item" />,
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders with icon", async () => {
    const TestIcon = () => <div data-testid="test-icon">Icon</div>;
    await render(
      <AccordionItem
        title="With Icon"
        icon={<TestIcon />}
        data-testid="accordion-item"
      />,
    );
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("does not show content initially when expandable", async () => {
    await render(
      <AccordionItem title="Expandable" expandable data-testid="accordion-item">
        <div>Content</div>
      </AccordionItem>,
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("shows content when clicked and expandable", async () => {
    await render(
      <AccordionItem title="Expandable" expandable data-testid="accordion-item">
        <div>Content</div>
      </AccordionItem>,
    );
    await userEvent.click(screen.getByText("Expandable"));
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("does not toggle when not expandable", async () => {
    await render(
      <AccordionItem title="Not Expandable" data-testid="accordion-item">
        <div>Content</div>
      </AccordionItem>,
    );
    await userEvent.click(screen.getByText("Not Expandable"));
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("shows chevron icon only when expandable", async () => {
    const { rerender } = await render(
      <AccordionItem title="Not Expandable" data-testid="accordion-item" />,
    );
    expect(screen.queryByTestId("chevron-down-icon")).not.toBeInTheDocument();

    rerender(
      <AccordionItem
        title="Expandable"
        expandable
        data-testid="accordion-item"
      />,
    );
    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
  });
});

describe("Accordion", () => {
  const items = [
    { title: "Item 1", children: <div>Content 1</div>, expandable: true },
    { title: "Item 2", children: <div>Content 2</div>, expandable: true },
  ];

  it("renders all items", async () => {
    await render(<Accordion items={items} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });
});
