import deepEqual from "deep-equal";
import { Index } from "../types/index.types.js";

export const matchingIndexes = (
  source: Index,
  target: Index,
  properties = ["dataSize", "entries", "primary", "replicas"]
): boolean => {
  for (let prop of properties) {
    if (!deepEqual(source[prop as keyof Index], target[prop as keyof Index])) {
      return false;
    }
  }
  return true;
};
