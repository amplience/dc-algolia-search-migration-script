import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { matchingIndexes } from "./matching-indexes.js";
import { Index } from "../types/index.types.js";

describe("matching-indexes", () => {
  let source: Index;
  let target: Index;

  beforeEach(() => {
    source = {
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
    };
    target = {
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
    };
  });

  it("should return true if default paramaters on both indexes match", () => {
    assert.deepEqual(matchingIndexes(source, target), true);
  });

  it("should return false if default `dataSize` parameters in both indexes do not match", () => {
    source.dataSize = 1;

    assert.deepEqual(matchingIndexes(source, target), false);
  });

  it("should return false if default `entries` parameter in both indexes do not match", () => {
    source.entries = 1;

    assert.deepEqual(matchingIndexes(source, target), false);
  });

  it("should return false if default `primary` parameter in both indexes do not match", () => {
    source.primary = "test-hub-01.my-first-index-02";

    assert.deepEqual(matchingIndexes(source, target), false);
  });

  it("should return false if default `replicas` parameter in both indexes do not match", () => {
    source.replicas = ["test-hub-01.my-first-index-01_title_asc"];

    assert.deepEqual(matchingIndexes(source, target), false);
  });

  it("should return true if non default parameter in both indexes do not match", () => {
    source.fileSize = 1;

    assert.deepEqual(matchingIndexes(source, target), true);
  });
});
