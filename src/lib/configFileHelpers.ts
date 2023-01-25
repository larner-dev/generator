import { JSONObject } from "@larner.dev/json-type";
import lodash from "lodash";
import json from "comment-json";
import { ConfigFileTypes, JSONValueOrUndefined } from "./types";
import { extname } from "path";

export const parseConfig = (
  file: string,
  type: ConfigFileTypes
): JSONValueOrUndefined => {
  return json.parse(file);
};

export const stringifyConfig = (
  val: JSONValueOrUndefined,
  type: ConfigFileTypes
): string => {
  return json.stringify(val, null, 2);
};

export const isConfigFile = (filePath: string): ConfigFileTypes | null => {
  const type = extname(filePath).toLowerCase() as ConfigFileTypes;
  if (Object.values(ConfigFileTypes).includes(type)) {
    return type;
  }
  return null;
};

const isObject = (val: unknown) => {
  return typeof val === "object" && !Array.isArray(val) && val !== null;
};

interface Node {
  keys: string[];
  final: JSONValueOrUndefined;
  isConflict: boolean;
}

export const configDiff = (
  before: JSONValueOrUndefined,
  current: JSONValueOrUndefined,
  after: JSONValueOrUndefined,
  keys: string[] = []
): Node[] => {
  if (lodash.isEqual(current, after)) {
    return [];
  }
  if (isObject(current) && isObject(after)) {
    const allKeys = [
      ...new Set<string>([
        ...Object.keys(current as Record<string, JSONValueOrUndefined>),
        ...Object.keys(after as Record<string, JSONValueOrUndefined>),
      ]),
    ];
    const conflicts = [];
    for (const key of allKeys) {
      conflicts.push(
        ...configDiff(
          (before as Record<string, JSONValueOrUndefined>)[key],
          (current as Record<string, JSONValueOrUndefined>)[key],
          (after as Record<string, JSONValueOrUndefined>)[key],
          [...keys, key]
        )
      );
    }
    return conflicts;
  }
  if (lodash.isEqual(before, current)) {
    return [{ keys: [...keys], final: after, isConflict: false }];
  }
  if (lodash.isEqual(before, after)) {
    return [{ keys: [...keys], final: current, isConflict: false }];
  }

  return [{ keys: [...keys], final: after, isConflict: true }];
};

export const applyChanges = (base: JSONValueOrUndefined, changes: Node[]) => {
  const current = lodash.cloneDeep(base);
  const after = lodash.cloneDeep(base);
  for (const change of changes) {
    let currentParent = current;
    let afterParent = after;
    for (let i = 0; i < change.keys.length - 1; i++) {
      currentParent = (currentParent as JSONObject)[change.keys[i]];
      afterParent = (afterParent as JSONObject)[change.keys[i]];
    }
    const lastKey = change.keys[change.keys.length - 1];
    if (!change.isConflict) {
      if (change.final === undefined) {
        delete (currentParent as JSONObject)[lastKey];
        delete (afterParent as JSONObject)[lastKey];
      } else {
        (currentParent as JSONObject)[lastKey] = change.final;
        (afterParent as JSONObject)[lastKey] = change.final;
      }
    } else {
      if (change.final === undefined) {
        delete (afterParent as JSONObject)[lastKey];
      } else {
        (afterParent as JSONObject)[lastKey] = change.final;
      }
    }
  }
  return { current, after };
};
