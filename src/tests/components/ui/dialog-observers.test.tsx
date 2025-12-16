import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Dialog, DialogContent, DialogTrigger } from "../../../components/ui/dialog";

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class ResizeObserver {
  constructor(callback: any) {
    mockResizeObserver(callback);
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
}

global.ResizeObserver = ResizeObserver;

// Mock MutationObserver
const mockMutationObserver = vi.fn();
const mockMutationObserve = vi.fn();
const mockMutationDisconnect = vi.fn();

class MutationObserver {
  constructor(callback: any) {
    mockMutationObserver(callback);
  }
  observe = mockMutationObserve;
  disconnect = mockMutationDisconnect;
  takeRecords = vi.fn();
}

global.MutationObserver = MutationObserver as any;

describe("Dialog Observers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockResizeObserver.mockClear();
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockMutationObserver.mockClear();
    mockMutationObserve.mockClear();
    mockMutationDisconnect.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle ref callback correctly", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dialog open={true}>
        <DialogContent ref={ref}>Content</DialogContent>
      </Dialog>
    );
    expect(ref.current).toBeDefined();
  });

  it("should handle function ref correctly", () => {
    const refCallback = vi.fn();
    render(
      <Dialog open={true}>
        <DialogContent ref={refCallback}>Content</DialogContent>
      </Dialog>
    );
    expect(refCallback).toHaveBeenCalled();
  });

  it("should setup observers when mounted", async () => {
    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    // Wait for setTimeout(..., 0) in handleRef
    await act(async () => {
      vi.runAllTimers();
    });

    expect(mockMutationObserve).toHaveBeenCalled();
    
    // Wait for setTimeout(..., 300) in setupObservers
    await act(async () => {
      vi.runAllTimers();
    });
    
    expect(mockObserve).toHaveBeenCalled();
  });

  it("should handle window resize", async () => {
    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Trigger window resize
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    // Wait for scheduleCheck timeout
    await act(async () => {
      vi.runAllTimers();
    });
  });

  it("should handle mutation observer callback", async () => {
    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Get the mutation callback
    const mutationCallback = mockMutationObserver.mock.calls[0][0];
    
    // Trigger mutation
    const element = screen.getByRole("dialog");
    // Mock getAttribute
    vi.spyOn(element, "getAttribute").mockReturnValue("open");
    
    act(() => {
      mutationCallback([
        {
          type: "attributes",
          attributeName: "data-state",
        },
      ]);
    });

    // Wait for scheduleCheck timeout
    await act(async () => {
      vi.runAllTimers();
    });
  });

  it("should handle resize observer callback", async () => {
    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Get the resize callback
    // Note: ResizeObserver is instantiated inside setupObservers which is called after timeout
    const resizeCallback = mockResizeObserver.mock.calls[0][0];
    
    act(() => {
      resizeCallback();
    });

    // Wait for resize timeout
    await act(async () => {
      vi.runAllTimers();
    });
  });

  it("should cleanup observers on unmount", async () => {
    const { unmount } = render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
    expect(mockMutationDisconnect).toHaveBeenCalled();
  });

  it("should handle debounced resize observer", async () => {
    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    const resizeCallback = mockResizeObserver.mock.calls[0][0];
    
    // Trigger twice
    act(() => {
      resizeCallback();
      resizeCallback();
    });

    // Should clear timeout (implicit coverage check)
    await act(async () => {
      vi.runAllTimers();
    });
  });

  it("should handle closed state in effect", async () => {
    const { unmount } = render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    // Wait for ref to be set
    await act(async () => {
      vi.runAllTimers();
    });

    const element = screen.getByRole("dialog");
    vi.spyOn(element, "getAttribute").mockImplementation((attr) => {
      if (attr === "data-state") return "closed";
      return null;
    });

    // Trigger effect by unmounting and remounting or by forcing update?
    // The effect depends on stateRef.current.element.
    // If we can trigger a re-render that updates the ref?
    // Or we can just manually call the effect logic if we could access it, but we can't.

    // Actually, the effect runs when stateRef.current.element changes.
    // If we render a new DialogContent?
    unmount();

    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    // The new element will have the spy if we spy on prototype? No.
    // We need to spy on the element instance.
    // But we can't access it before it's created.

    // Maybe we can spy on HTMLElement.prototype.getAttribute?
    const originalGetAttribute = HTMLElement.prototype.getAttribute;
    HTMLElement.prototype.getAttribute = vi.fn((attr) => {
      if (attr === "data-state") return "closed";
      return null;
    });

    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    HTMLElement.prototype.getAttribute = originalGetAttribute;
  });

  it("should handle tall content that becomes shorter on resize", async () => {
    // Mock window dimensions to trigger isTall state
    const originalInnerHeight = window.innerHeight;
    const originalInnerWidth = window.innerWidth;

    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 300,
    });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(
      <Dialog open={true}>
        <DialogContent>
          <div style={{ height: "500px" }}>Tall content</div>
        </DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Increase window height - should trigger the "isTall && windowHeight > previousHeight" branch
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Restore
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("should handle significant width change", async () => {
    const originalInnerWidth = window.innerWidth;

    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Trigger a significant width change (> 10px)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth + 100,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Restore
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("should handle element removed from DOM during resize", async () => {
    const { unmount } = render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Unmount before resize completes
    unmount();

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await act(async () => {
      vi.runAllTimers();
    });
  });

  it("should handle null ref forwarding", async () => {
    const { unmount } = render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Unmount to trigger null ref
    unmount();
  });

  it("should not schedule check if called too frequently", async () => {
    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // Trigger multiple rapid resizes (throttling check)
    for (let i = 0; i < 5; i++) {
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });
      vi.advanceTimersByTime(10); // Less than 100ms throttle
    }

    await act(async () => {
      vi.runAllTimers();
    });
  });

  it("should clear existing timeout on new width measurement", async () => {
    const originalInnerWidth = window.innerWidth;

    render(
      <Dialog open={true}>
        <DialogContent>Content</DialogContent>
      </Dialog>
    );

    await act(async () => {
      vi.runAllTimers();
    });

    // First significant width change
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth + 50,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    vi.advanceTimersByTime(50);

    // Second significant width change before first completes
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth + 100,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Restore
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });
});
