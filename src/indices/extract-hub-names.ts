import { Index } from "./indices.types.js";

export const extractHubNames = (indices: Index[]) => {
  return indices.reduce((hubNames: string[], { name }) => {
    const hubName = name.split(".")[0];
    if (!hubNames.includes(hubName)) {
      return [...hubNames, hubName];
    }
    return hubNames;
  }, []);
};
