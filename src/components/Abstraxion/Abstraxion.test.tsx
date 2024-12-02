import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Abstraxion } from "./index";
import { AbstraxionContext } from "../../components/AbstraxionContext";
import { useAbstraxionAccount } from "../../hooks";
import { useQueryParams } from "../../hooks/useQueryParams";

// Mock hooks
vi.mock("../../hooks/useQueryParams");
vi.mock("../../hooks/useAbstraxionAccount");

const mockUseQueryParams = useQueryParams as jest.Mock;
const mockUseAbstraxionAccount = useAbstraxionAccount as jest.Mock;

describe("Abstraxion Component", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (contextValue: any, props: any) => {
    return render(
      <AbstraxionContext.Provider value={contextValue}>
        <Abstraxion {...props} />
      </AbstraxionContext.Provider>,
    );
  };

  it("should render null when isOpen is false", () => {
    renderComponent({}, { isOpen: false, onClose });
    expect(screen.queryByText("Disclaimer")).toBeNull();
  });

  it("should render ErrorDisplay when there is an error", () => {
    renderComponent(
      { abstraxionError: "Test Error", isMainnet: true },
      { isOpen: true, onClose },
    );
    expect(screen.getByText("Test Error")).toBeInTheDocument();
  });

  it("should render AbstraxionGrant when account is connected and grantee is present", () => {
    mockUseQueryParams.mockReturnValue({
      contracts: '["contract1"]',
      stake: "true",
      bank: '["bank1"]',
      grantee: "grantee1",
      treasury: "treasury1",
    });
    mockUseAbstraxionAccount.mockReturnValue({
      isConnected: true,
      data: { id: "account1" },
    });

    renderComponent(
      { abstraxionError: null, isMainnet: true },
      { isOpen: true, onClose },
    );

    expect(screen.getByText("grantee1")).toBeInTheDocument();
  });

  it("should render AbstraxionWallets when account is connected but no grantee", () => {
    mockUseQueryParams.mockReturnValue({});
    mockUseAbstraxionAccount.mockReturnValue({
      isConnected: true,
      data: { id: "account1" },
    });

    renderComponent(
      { abstraxionError: null, isMainnet: true },
      { isOpen: true, onClose },
    );

    expect(screen.getByText("Wallets")).toBeInTheDocument();
  });

  it("should render AbstraxionSignin when account is not connected", () => {
    mockUseQueryParams.mockReturnValue({});
    mockUseAbstraxionAccount.mockReturnValue({
      isConnected: false,
      data: null,
    });

    renderComponent(
      { abstraxionError: null, isMainnet: true },
      { isOpen: true, onClose },
    );

    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("should call onClose when Escape key is pressed", () => {
    renderComponent(
      { abstraxionError: null, isMainnet: true },
      { isOpen: true, onClose },
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("should render TOS Footer when not connected", () => {
    mockUseAbstraxionAccount.mockReturnValue({
      isConnected: false,
      data: null,
    });

    renderComponent(
      { abstraxionError: null, isMainnet: true },
      { isOpen: true, onClose },
    );

    expect(screen.getByText("Disclaimer")).toBeInTheDocument();
  });
});
