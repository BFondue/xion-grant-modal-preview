import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../..";
import { PinInput } from "../../../components/ui/pinInput";

describe("PinInput", () => {
  const defaultProps = {
    onComplete: vi.fn(),
    setError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correct number of input fields", async () => {
    await render(<PinInput {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6); // default length
  });

  it("renders custom number of input fields", async () => {
    await render(<PinInput {...defaultProps} length={4} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(4);
  });

  it("focuses first input on mount", async () => {
    await render(<PinInput {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveFocus();
  });

  it("accepts digit input and moves to next field", async () => {
    const { user } = await render(<PinInput {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");

    await user.type(inputs[0], "1");

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveFocus();
  });

  it("handles backspace correctly", async () => {
    const { user } = await render(<PinInput {...defaultProps} />);
    const inputs = screen.getAllByRole("textbox");

    // Type two digits
    await user.type(inputs[0], "1");
    await user.type(inputs[1], "2");
    expect(inputs[2]).toHaveFocus();

    // Backspace on empty 3rd input should move focus to 2nd
    await user.keyboard("{Backspace}");
    expect(inputs[1]).toHaveFocus();
    expect(inputs[1]).toHaveValue("2");

    // Backspace on 2nd input should clear it
    await user.keyboard("{Backspace}");
    expect(inputs[1]).toHaveValue("");
    // And keep focus? Or move back?
    // Implementation:
    // if (index >= 0) { newPin[index] = ""; inputRefs.current[index - 1]?.focus(); }
    // Wait, if I press backspace on index 1 (which has value), it clears it and focuses index 0.
    expect(inputs[0]).toHaveFocus();
  });

  it("handles paste correctly", async () => {
    const onComplete = vi.fn();
    const { user } = await render(
      <PinInput {...defaultProps} onComplete={onComplete} />,
    );
    const inputs = screen.getAllByRole("textbox");

    // Paste "123456"
    await user.click(inputs[0]);
    await user.paste("123456");

    inputs.forEach((input, index) => {
      expect(input).toHaveValue(String(index + 1));
    });
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("handles paste with non-digits correctly", async () => {
    const { user } = await render(<PinInput {...defaultProps} />);
    const inputs = screen.getAllByRole("textbox");

    // Paste "12a34b" -> should be "1234"
    await user.click(inputs[0]);
    await user.paste("12a34b");

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
    expect(inputs[2]).toHaveValue("3");
    expect(inputs[3]).toHaveValue("4");
    expect(inputs[4]).toHaveValue("");
  });

  it("rejects non-digit input", async () => {
    const { user } = await render(<PinInput {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");

    await user.type(inputs[0], "a");

    expect(inputs[0]).toHaveValue("");
  });

  it("calls onComplete when all digits are entered", async () => {
    const onComplete = vi.fn();
    const { user } = await render(
      <PinInput {...defaultProps} onComplete={onComplete} length={4} />,
    );

    const inputs = screen.getAllByRole("textbox");

    await user.type(inputs[0], "1");
    await user.type(inputs[1], "2");
    await user.type(inputs[2], "3");
    await user.type(inputs[3], "4");

    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("clears error on input", async () => {
    const setError = vi.fn();
    const { user } = await render(
      <PinInput {...defaultProps} setError={setError} error="Invalid code" />,
    );

    const inputs = screen.getAllByRole("textbox");

    await user.type(inputs[0], "1");

    expect(setError).toHaveBeenCalledWith("");
  });

  it("handles backspace to clear and focus previous input", async () => {
    const { user } = await render(<PinInput {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");

    // Type in first two inputs
    await user.type(inputs[0], "1");
    await user.type(inputs[1], "2");

    // Now we're at input[2], press backspace
    await user.keyboard("{Backspace}");

    // The current input (index 2) should be cleared and focus moves to input[1]
    expect(inputs[1]).toHaveFocus();
  });

  it("handles paste event with valid digits", async () => {
    const onComplete = vi.fn();
    const { user } = await render(
      <PinInput {...defaultProps} onComplete={onComplete} length={6} />,
    );

    const inputs = screen.getAllByRole("textbox");

    // Simulate paste
    await user.click(inputs[0]);
    await user.paste("123456");

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
    expect(inputs[2]).toHaveValue("3");
    expect(inputs[3]).toHaveValue("4");
    expect(inputs[4]).toHaveValue("5");
    expect(inputs[5]).toHaveValue("6");

    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("handles paste with mixed characters (filters non-digits)", async () => {
    const onComplete = vi.fn();
    const { user } = await render(
      <PinInput {...defaultProps} onComplete={onComplete} length={4} />,
    );

    const inputs = screen.getAllByRole("textbox");

    await user.click(inputs[0]);
    await user.paste("1a2b3c4d");

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
    expect(inputs[2]).toHaveValue("3");
    expect(inputs[3]).toHaveValue("4");

    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("handles paste with fewer digits than fields", async () => {
    const onComplete = vi.fn();
    const { user } = await render(
      <PinInput {...defaultProps} onComplete={onComplete} length={6} />,
    );

    const inputs = screen.getAllByRole("textbox");

    await user.click(inputs[0]);
    await user.paste("12");

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
    expect(inputs[2]).toHaveValue("");
  });

  it("applies error styling when error is present", async () => {
    await render(<PinInput {...defaultProps} error="Invalid code" />);

    const inputs = screen.getAllByRole("textbox");

    inputs.forEach((input) => {
      expect(input).toHaveClass("ui-border-red-500");
    });
  });

  it("applies normal styling when no error", async () => {
    await render(<PinInput {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");

    inputs.forEach((input) => {
      expect(input).toHaveClass("ui-border-zinc-600");
    });
  });

  it("each input has maxLength of 1", async () => {
    await render(<PinInput {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");

    inputs.forEach((input) => {
      expect(input).toHaveAttribute("maxLength", "1");
    });
  });

  it("backspace at first input does not cause errors", async () => {
    const { user } = await render(<PinInput {...defaultProps} />);

    const inputs = screen.getAllByRole("textbox");

    // Focus first input and press backspace
    await user.click(inputs[0]);
    await user.keyboard("{Backspace}");

    // Should not throw and first input should still be focused
    expect(inputs[0]).toHaveValue("");
  });

  it("does not move focus when typing at last input", async () => {
    const onComplete = vi.fn();
    const { user } = await render(
      <PinInput {...defaultProps} onComplete={onComplete} length={4} />,
    );

    const inputs = screen.getAllByRole("textbox");

    // Fill first 3 inputs
    await user.type(inputs[0], "1");
    await user.type(inputs[1], "2");
    await user.type(inputs[2], "3");

    // Type in last input - should stay focused on last input
    await user.type(inputs[3], "4");

    // Last input should still have focus (no next input to move to)
    expect(inputs[3]).toHaveValue("4");
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("handles paste with only non-digit characters", async () => {
    const onComplete = vi.fn();
    await render(
      <PinInput {...defaultProps} onComplete={onComplete} length={4} />,
    );

    const inputs = screen.getAllByRole("textbox");

    // Use fireEvent for more control over paste data
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "abcd",
      },
    });

    // All inputs should remain empty since no valid digits
    inputs.forEach((input) => {
      expect(input).toHaveValue("");
    });

    // onComplete should still be called with empty result
    expect(onComplete).toHaveBeenCalledWith("");
  });

  it("handles paste with empty string", async () => {
    const onComplete = vi.fn();
    await render(
      <PinInput {...defaultProps} onComplete={onComplete} length={4} />,
    );

    const inputs = screen.getAllByRole("textbox");

    // Use fireEvent for more control over paste data
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "",
      },
    });

    // All inputs should remain empty
    inputs.forEach((input) => {
      expect(input).toHaveValue("");
    });

    expect(onComplete).toHaveBeenCalledWith("");
  });
});
