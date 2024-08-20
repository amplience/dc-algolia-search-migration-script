import "dotenv/config";
import { $ } from "zx";
import deepEqual from "deep-equal";
import createLogger from "../../src/logger/logger.js";
import { ListIndexResponse } from "../algolia-cli/types/list-index-response.types.js";
import { matchingIndexes } from "../algolia-cli/matching-indexes/matching-indexes.js";

const TIMESTAMP = new Date()
  .toISOString()
  .replace(/[^0-9]/g, "")
  .slice(0, -3);

const TMP_PATH = `./.tmp/validate/${TIMESTAMP}/`;
const logger = createLogger(TMP_PATH);

const {
  DC_ALGOLIA_INDEX_APP_ID,
  DC_ALGOLIA_INDEX_API_KEY,
  TARGET_ALGOLIA_INDEX_APP_ID,
  TARGET_ALGOLIA_INDEX_API_KEY,
} = process.env;

const DC_ALGOLIA_PROFILE_NAME = "dc_algolia_profile";
const TARGET_ALGOLIA_PROFILE_NAME = "target_algolia_profile";

logger.info("Checking for Algolia CLI");
try {
  await $`algolia --help`;
} catch (e) {
  throw new Error(
    "Algolia CLI not installed: https://www.algolia.com/doc/tools/cli/get-started/overview/#install-the-algolia-cli"
  );
}

logger.info("Checking profiles information is available");
if (
  !DC_ALGOLIA_INDEX_APP_ID ||
  !DC_ALGOLIA_INDEX_API_KEY ||
  !TARGET_ALGOLIA_INDEX_APP_ID ||
  !TARGET_ALGOLIA_INDEX_API_KEY
) {
  throw new Error("Required profile data missing");
}

logger.info("Creating Algolia CLI profile for DC Algolia");
await $`algolia profile add --name ${DC_ALGOLIA_PROFILE_NAME} --app-id ${DC_ALGOLIA_INDEX_APP_ID} --api-key ${DC_ALGOLIA_INDEX_API_KEY}`;
logger.info("Creating Algolia CLI profile for Target Algolia account");
await $`algolia profile add --name ${TARGET_ALGOLIA_PROFILE_NAME} --app-id ${TARGET_ALGOLIA_INDEX_APP_ID} --api-key ${TARGET_ALGOLIA_INDEX_API_KEY}`;

try {
  logger.info("Listing source indexes");
  const sourceIndexesResponse =
    await $`algolia indices list -p ${DC_ALGOLIA_PROFILE_NAME} -o json | tee ${TMP_PATH}source_indexes.json`;
  const { items: sourceIndexes } =
    sourceIndexesResponse.json<ListIndexResponse>();

  logger.info("Listing target indexes");
  const targetIndexesResponse =
    await $`algolia indices list -p ${TARGET_ALGOLIA_PROFILE_NAME} -o json | tee ${TMP_PATH}target_indexes.json`;

  const { items: targetIndexes } =
    targetIndexesResponse.json<ListIndexResponse>();

  for (const sourceIndex of sourceIndexes) {
    const indexName = sourceIndex.name;
    logger.info("Validating index", { indexName });
    logger.info("Checking index for target mismatches", { indexName });
    const targetIndex = targetIndexes.find(
      ({ name }) => name === sourceIndex.name
    );
    if (!targetIndex) {
      logger.error("Target index not found", {
        sourceIndex,
      });
      continue; // nothing to compare
    }
    if (!matchingIndexes(sourceIndex, targetIndex)) {
      logger.error("Source and target indexes do not match", {
        sourceIndex,
        targetIndex,
      });
    }

    logger.info("Checking rules match", { indexName });
    await $`algolia rules browse ${indexName} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${indexName}_source_rules_export.ndjson`;
    await $`algolia rules browse ${indexName} -p ${TARGET_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${indexName}_target_rules_export.ndjson`;
    const rulesDiffOutput =
      await $`diff ${TMP_PATH}${indexName}_source_rules_export.ndjson ${TMP_PATH}${indexName}_target_rules_export.ndjson`.nothrow();

    if (rulesDiffOutput.exitCode === 1) {
      logger.error("Source and target index rules do not match", {
        sourceIndex,
        targetIndex,
      });
    }

    logger.info("Checking synonyms match", { indexName });
    await $`algolia synonyms browse ${indexName} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${indexName}_source_synonyms_export.ndjson`;
    await $`algolia synonyms browse ${indexName} -p ${TARGET_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${indexName}_target_synonyms_export.ndjson`;
    const synonymsDiffOutput =
      await $`diff ${TMP_PATH}${indexName}_source_synonyms_export.ndjson ${TMP_PATH}${indexName}_target_synonyms_export.ndjson`.nothrow();

    if (synonymsDiffOutput.exitCode === 1) {
      logger.error("Source and target index synonyms do not match", {
        sourceIndex,
        targetIndex,
      });
    }

    logger.info("Checking settings match", { indexName });
    await $`algolia settings get ${indexName} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${indexName}_source_settings_export.ndjson`;
    await $`algolia settings get ${indexName} -p ${TARGET_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${indexName}_target_settings_export.ndjson`;
    const settingsDiff =
      await $`diff ${TMP_PATH}${indexName}_source_settings_export.ndjson ${TMP_PATH}${indexName}_target_settings_export.ndjson`.nothrow();

    if (settingsDiff.exitCode === 1) {
      logger.error("Source and target index settings do not match", {
        sourceIndex,
        targetIndex,
      });
    }
  }
} catch (error) {
  logger.error("Validation failed", { error });
} finally {
  logger.info("Cleaning up Algolia CLI profiles");
  await $`algolia profile remove ${DC_ALGOLIA_PROFILE_NAME}`;
  await $`algolia profile remove ${TARGET_ALGOLIA_PROFILE_NAME}`;
  logger.info("Validation complete");
}
