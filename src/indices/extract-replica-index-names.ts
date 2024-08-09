import { Index } from "./indices.types.js";

export const extractReplicaIndexNames = (indices: Index[]) => {
  return indices.reduce((replicas: string[], index) => {
    if (index?.replicas?.length > 0) {
      return [...replicas, ...index?.replicas];
    }
    return replicas;
  }, []);
};
