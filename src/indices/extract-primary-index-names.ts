import { Index } from "./indices.types.js";

export const extractPrimaryIndexNames = (indices: Index[]) => {
  return indices.filter(({ primary }) => !primary).map(({ name }) => name);
};
