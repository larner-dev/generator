import { configDiff } from "./configFileHelpers";

describe("diff", () => {
  describe("array", () => {
    test("it should not conflict with three empty arrays", () => {
      expect(configDiff([], [], [])).toEqual([
        {
          keys: [],
          final: [],
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict with three arrays that are equal", () => {
      expect(configDiff(["a"], ["a"], ["a"])).toEqual([
        {
          keys: [],
          final: ["a"],
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict if the key was not previously changed", () => {
      expect(configDiff(["a"], ["a"], ["a", "b"])).toEqual([
        {
          keys: [],
          final: ["a", "b"],
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict and pick the current value if the key was not changed", () => {
      expect(configDiff(["a"], ["b"], ["a"])).toEqual([
        {
          keys: [],
          final: ["b"],
          isConflict: false,
        },
      ]);
    });
    test("it should conflict if the key was changed", () => {
      expect(configDiff(["a"], ["b"], ["c"])).toEqual([
        {
          keys: [],
          final: ["c"],
          isConflict: true,
        },
      ]);
    });
  });
  describe("string", () => {
    test("it should not conflict with three empty strings", () => {
      expect(configDiff("", "", "")).toEqual([
        {
          keys: [],
          final: "",
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict with three strings that are equal", () => {
      expect(configDiff("a", "a", "a")).toEqual([
        {
          keys: [],
          final: "a",
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict if the key was not previously changed", () => {
      expect(configDiff("a", "a", "ab")).toEqual([
        {
          keys: [],
          final: "ab",
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict and pick the current value if the key was not changed", () => {
      expect(configDiff("a", "b", "a")).toEqual([
        {
          keys: [],
          final: "b",
          isConflict: false,
        },
      ]);
    });
    test("it should conflict if the type was changed", () => {
      expect(configDiff("1", "2", 2)).toEqual([
        {
          keys: [],
          final: 2,
          isConflict: true,
        },
      ]);
    });
  });

  describe("object", () => {
    test("it should not conflict with three empty objects", () => {
      expect(configDiff({}, {}, {})).toEqual([
        {
          keys: [],
          final: {},
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict with three objects that are equal", () => {
      expect(
        configDiff({ foo: "bar" }, { foo: "bar" }, { foo: "bar" })
      ).toEqual([
        {
          keys: [],
          final: { foo: "bar" },
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict if the key was not previously changed", () => {
      expect(
        configDiff({ foo: "bar" }, { foo: "bar" }, { foo: "baz" })
      ).toEqual([
        {
          keys: [],
          final: { foo: "baz" },
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict and pick the current value if the key was not changed", () => {
      expect(
        configDiff({ foo: "bar" }, { foo1: "bar" }, { foo: "bar" })
      ).toEqual([
        {
          keys: [],
          final: { foo1: "bar" },
          isConflict: false,
        },
      ]);
    });
    test("it should conflict if the type was changed", () => {
      expect(configDiff("a", "b", { foo: "bar" })).toEqual([
        {
          keys: [],
          final: { foo: "bar" },
          isConflict: true,
        },
      ]);
    });
  });

  describe("nested object", () => {
    test("it should not conflict with three empty objects", () => {
      expect(configDiff({ foo: {} }, { foo: {} }, { foo: {} })).toEqual([
        {
          keys: [],
          final: { foo: {} },
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict with three objects that are equal", () => {
      expect(
        configDiff(
          { a: { foo: "bar" } },
          { a: { foo: "bar" } },
          { a: { foo: "bar" } }
        )
      ).toEqual([
        {
          keys: [],
          final: { a: { foo: "bar" } },
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict if the key was not previously changed", () => {
      expect(
        configDiff(
          { a: { foo: "bar" } },
          { a: { foo: "bar" } },
          { a: { foo: "baz" } }
        )
      ).toEqual([
        {
          keys: [],
          final: { a: { foo: "baz" } },
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict and pick the current value if the key was not changed", () => {
      expect(
        configDiff(
          { a: { foo: "bar" } },
          { a: { foo1: "bar" } },
          { a: { foo: "bar" } }
        )
      ).toEqual([
        {
          keys: [],
          final: { a: { foo1: "bar" } },
          isConflict: false,
        },
      ]);
    });
    test.only("it should not conflict and pick the current value if the key was not changed", () => {
      expect(
        configDiff(
          { a: { foo: "bar" } },
          { a: { foo1: "bar" } },
          { a: { foo: "bar", foo2: "bar" } }
        )
      ).toEqual([
        {
          keys: ["a", "foo1"],
          final: "bar",
          isConflict: false,
        },
        {
          keys: ["a", "foo"],
          final: undefined,
          isConflict: false,
        },
        {
          keys: ["a", "foo2"],
          final: "bar",
          isConflict: false,
        },
      ]);
    });
    test("it should not conflict and pick the current value if the key was not changed", () => {
      const result = configDiff(
        { a: { foo: "bar1" } },
        { a: { foo: "bar2" } },
        { a: { foo: "bar3" } }
      );
      expect(result).toEqual([
        {
          keys: ["a", "foo"],
          final: "bar3",
          isConflict: true,
        },
      ]);
    });
    test("it should not conflict and pick the current value if the key was not changed", () => {
      const result = configDiff(
        { a: { foo: "bar1" } },
        { a: { foo1: "bar2" } },
        { a: { foo1: "bar3" } }
      );
      expect(result).toEqual([
        {
          keys: ["a", "foo1"],
          final: "bar3",
          isConflict: true,
        },
      ]);
    });
    test("it should not conflict and pick the current value if the key was not changed", () => {
      const result = configDiff(
        { a: { foo: "bar1" } },
        { a: { foo1: "bar2", foo2: "bar2" } },
        { a: { foo1: "bar3", foo2: "bar2" } }
      );
      expect(result).toEqual([
        {
          keys: ["a", "foo1"],
          final: "bar3",
          isConflict: true,
        },
      ]);
    });
  });
});
