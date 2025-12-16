import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import OtpForm from "../../../components/OtpForm/index";

// Mock the clipboard API
vi.mock("navigator.clipboard", () => ({
  readText: vi.fn().mockResolvedValue("123456"),
}));

// Create a global navigator.clipboard object for the tests
if (!global.navigator.clipboard) {
  Object.defineProperty(global.navigator, "clipboard", {
    value: {
      readText: vi.fn().mockResolvedValue("123456"),
    },
    configurable: true,
  });
}

describe("OtpForm Component", () => {
  const mockHandleOtp = vi.fn().mockResolvedValue(undefined);
  const mockHandleResendCode = vi.fn().mockResolvedValue(undefined);
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderOtpForm = (error: string | null = null) => {
    return render(
      <OtpForm
        handleOtp={mockHandleOtp}
        handleResendCode={mockHandleResendCode}
        error={error}
        setError={mockSetError}
      />,
    );
  };

  it("renders six input fields", () => {
    renderOtpForm();
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(6);
  });

  it("focuses first input on initial render", () => {
    renderOtpForm();
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveFocus();
  });

  it("moves focus to next input when digit is entered", async () => {
    renderOtpForm();
    const inputs = screen.getAllByRole("spinbutton");

    await userEvent.type(inputs[0], "1");
    expect(inputs[1]).toHaveFocus();
  });

  it("moves focus to previous input on backspace when current input is empty", async () => {
    renderOtpForm();
    const inputs = screen.getAllByRole("spinbutton");

    await userEvent.type(inputs[0], "1");
    await userEvent.type(inputs[1], "{backspace}");
    expect(inputs[0]).toHaveFocus();
  });

  it("handles paste event correctly", async () => {
    renderOtpForm();
    const inputs = screen.getAllByRole("spinbutton");

    // Create a paste event with clipboard data
    const clipboardData = {
      getData: vi.fn().mockReturnValue("123456"),
    };

    await act(async () => {
      fireEvent.paste(inputs[0], { clipboardData });
    });

    // Verify inputs are filled with pasted data
    const filledInputs = screen.getAllByRole("spinbutton");
    for (let i = 0; i < 6; i++) {
      // Add an expectation to make the test more meaningful
      expect(filledInputs[i]).toHaveValue(Number(i + 1));
    }
  });

  it("only allows numeric input", async () => {
    renderOtpForm();
    const inputs = screen.getAllByRole("spinbutton");

    await userEvent.type(inputs[0], "a");
    expect(inputs[0]).toHaveValue(null);

    await userEvent.type(inputs[0], "1");
    expect(inputs[0]).toHaveValue(1);
  });

  it("submits form when all digits are entered and confirm is clicked", async () => {
    renderOtpForm();
    const inputs = screen.getAllByRole("spinbutton");

    for (let i = 0; i < 6; i++) {
      await userEvent.type(inputs[i], String(i + 1));
    }

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await userEvent.click(confirmButton);

    expect(mockHandleOtp).toHaveBeenCalledWith("123456");
  });

  it("shows error message when provided", () => {
    const errorMessage = "Invalid OTP";
    renderOtpForm(errorMessage);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("calls resend code function when button is clicked", async () => {
    renderOtpForm();

    const resendButton = screen.getByRole("button", { name: /resend code/i });
    await userEvent.click(resendButton);

    expect(mockHandleResendCode).toHaveBeenCalled();
  });

  it("clears error when new input is entered", async () => {
    renderOtpForm("Initial error");
    const inputs = screen.getAllByRole("spinbutton");

    await userEvent.type(inputs[0], "1");
    expect(mockSetError).toHaveBeenCalledWith(null);
  });

  it("calls handleOtp when Enter key is pressed with valid input", async () => {
    renderOtpForm();
    const inputs = screen.getAllByRole("spinbutton");

    for (let i = 0; i < 6; i++) {
      await userEvent.type(inputs[i], String(i + 1));
    }

    await userEvent.type(inputs[5], "{enter}");
    expect(mockHandleOtp).toHaveBeenCalledWith("123456");
  });
});
