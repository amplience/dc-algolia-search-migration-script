import { Index } from "../types/index.types.js";

export const extractPrimaryIndexNames = (indices: Index[]) => {
  return indices.filter(({ primary }) => !primary).map(({ name }) => name);
};
