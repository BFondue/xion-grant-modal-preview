import "@testing-library/jest-dom/vitest";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { configure } from "@testing-library/react";

configure({
  asyncUtilTimeout: 1000,
});

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

declare module "vitest" {
  interface Assertion<T> {
    toHaveClass: (className: string) => T;
    toBeInTheDocument: () => T;
    // Using any[] to match Vitest's internal type definition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toHaveBeenCalledExactlyOnceWith: <E extends any[]>(...args: E) => void;
  }
}
