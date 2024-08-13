import { describe, it } from "node:test";
import assert from "node:assert";
import { extractPrimaryIndexNames } from "./extract-primary-index-names.js";

describe("extract-primary-index-names", () => {
  it("should only extract primary indexes", () => {
    const indexes = [
      {
        dataSize: 1024,
        entries: 10,
        fileSize: 2048,
        name: "test-hub-01.my-first-index-01",
        numberOfPendingTasks: 0,
        pendingTask: false,
        primary: "",
        replicas: [
          "test-hub-01.my-first-index-01_title_asc",
          "test-hub-02.my-first-index-02_title_desc",
        ],
      },
      {
        dataSize: 1024,
        entries: 10,
        fileSize: 2048,
        name: "test-hub-01.my-first-index-01_title_asc",
        numberOfPendingTasks: 0,
        pendingTask: false,
        primary: "test-hub-01.my-first-index-01",
        replicas: [],
      },
      {
        dataSize: 1024,
        entries: 10,
        fileSize: 2048,
        name: "test-hub-02.my-first-index-02_title_desc",
        numberOfPendingTasks: 0,
        pendingTask: false,
        primary: "test-hub-01.my-first-index-01",
        replicas: [],
      },
    ];
    assert.deepEqual(extractPrimaryIndexNames(indexes), [
      "test-hub-01.my-first-index-01",
    ]);
  });
});
