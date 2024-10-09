import {findLowestMissingOrNextIndex} from "../utils/authenticator-util";
import { describe, expect, test } from '@jest/globals';
import { Authenticator } from "../indexer-strategies/types";


describe("findLowestMissingOrNextIndex", () => {
  test("should return 2 when there is a missing index 2", () => {
    const data = [
      { authenticatorIndex: 0 },
      { authenticatorIndex: 1 },
      { authenticatorIndex: 3 },
      { authenticatorIndex: 4 },
    ] as Authenticator[]; // forcing type for test sake
    expect(findLowestMissingOrNextIndex(data)).toBe(2);
  });

  test("should return 4 when there are no missing indices in [0, 1, 2, 3]", () => {
    const data = [
      { authenticatorIndex: 0 },
      { authenticatorIndex: 1 },
      { authenticatorIndex: 2 },
      { authenticatorIndex: 3 },
    ] as Authenticator[]; // forcing type for test sake
    expect(findLowestMissingOrNextIndex(data)).toBe(4);
  });

  test("should return 0 when the array is empty", () => {
    const data = [] as Authenticator[]; // forcing type for test sake
    expect(findLowestMissingOrNextIndex(data)).toBe(0);
  });

  test("should return the next index for a single-element array starting at index 0", () => {
    const data = [{ authenticatorIndex: 0 }] as Authenticator[]; // forcing type for test sake
    expect(findLowestMissingOrNextIndex(data)).toBe(1);
  });

  test("should return the first missing index for a single-element array not starting at index 0", () => {
    const data = [{ authenticatorIndex: 3 }] as Authenticator[]; // forcing type for test sake
    expect(findLowestMissingOrNextIndex(data)).toBe(0);
  });
});
