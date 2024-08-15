export type Index = {
  dataSize: number;
  entries: number;
  fileSize: number;
  name: string;
  numberOfPendingTasks: number;
  pendingTask: boolean;
  primary: string;
  replicas: string[];
};
