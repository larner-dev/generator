import { index } from "./index";
import { describe, test, expect } from "vitest";

describe("index", () => {
  test("true should be true", () => {
    expect(index).toEqual("foo");
  });
});
