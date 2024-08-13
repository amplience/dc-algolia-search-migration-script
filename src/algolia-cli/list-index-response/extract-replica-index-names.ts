import { Index } from "../types/index.types.js";

export const extractReplicaIndexNames = (indices: Index[]) => {
  return indices.reduce((replicas: string[], index) => {
    if (index?.replicas?.length > 0) {
      return [...replicas, ...index?.replicas];
    }
    return replicas;
  }, []);
};
