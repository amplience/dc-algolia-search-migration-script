import { describe, it } from "node:test";
import assert from "node:assert";
import { extractHubNames } from "./extract-hub-names.js";

describe("extract-hub-names", () => {
  it("should extract a single hub name when given a list of indexes from the same hub", () => {
    const indexes = [
      {
        dataSize: 1024,
        entries: 10,
        fileSize: 2048,
        name: "test-hub-01.my-first-index-01",
        numberOfPendingTasks: 0,
        pendingTask: false,
        primary: "",
        replicas: [],
      },
      {
        dataSize: 1024,
        entries: 10,
        fileSize: 2048,
        name: "test-hub-01.my-first-index-02",
        numberOfPendingTasks: 0,
        pendingTask: false,
        primary: "",
        replicas: [],
      },
    ];
    assert.deepEqual(extractHubNames(indexes), ["test-hub-01"]);
  });

  it("should extract a multiple hub names when given a list of indexes from the different hubs", () => {
    const indexes = [
      {
        dataSize: 1024,
        entries: 10,
        fileSize: 2048,
        name: "test-hub-01.my-first-index-01",
        numberOfPendingTasks: 0,
        pendingTask: false,
        primary: "",
        replicas: [],
      },
      {
        dataSize: 1024,
        entries: 10,
        fileSize: 2048,
        name: "test-hub-02.my-first-index-02",
        numberOfPendingTasks: 0,
        pendingTask: false,
        primary: "",
        replicas: [],
      },
    ];
    assert.deepEqual(extractHubNames(indexes), ["test-hub-01", "test-hub-02"]);
  });
});
