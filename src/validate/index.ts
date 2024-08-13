import "dotenv/config";
import { $ } from "zx";
import deepEqual from "deep-equal";
import createLogger from "../../src/logger/logger.js";
import { ListIndexResponse } from "../algolia-cli/types/list-index-response.types.js";

const TIMESTAMP = new Date()
  .toISOString()
  .replace(/[^0-9]/g, "")
  .slice(0, -3);

const TMP_PATH = `./.tmp/validate/${TIMESTAMP}/`;
const logger = createLogger(TMP_PATH);

const {
  DC_ALGOLIA_INDEX_APP_ID,
  DC_ALGOLIA_INDEX_API_KEY,
  RESELLER_ALGOLIA_INDEX_APP_ID,
  RESELLER_ALGOLIA_INDEX_API_KEY,
} = process.env;

const DC_ALGOLIA_PROFILE_NAME = "dc_algolia_profile";
const RESELLER_ALGOLIA_PROFILE_NAME = "reseller_algolia_profile";

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
  !RESELLER_ALGOLIA_INDEX_APP_ID ||
  !RESELLER_ALGOLIA_INDEX_API_KEY
) {
  throw new Error("Required profile data missing");
}

logger.info("Creating Algolia CLI profile for DC Algolia");
await $`algolia profile add --name ${DC_ALGOLIA_PROFILE_NAME} --app-id ${DC_ALGOLIA_INDEX_APP_ID} --api-key ${DC_ALGOLIA_INDEX_API_KEY}`;
logger.info("Creating Algolia CLI profile for Reseller");
await $`algolia profile add --name ${RESELLER_ALGOLIA_PROFILE_NAME} --app-id ${RESELLER_ALGOLIA_INDEX_APP_ID} --api-key ${RESELLER_ALGOLIA_INDEX_API_KEY}`;

try {
  logger.info("Listing source indexes");
  const sourceIndexesResponse =
    await $`algolia indices list -p ${DC_ALGOLIA_PROFILE_NAME} -o json | tee ${TMP_PATH}source_indexes.json`;
  const { items: sourceIndexes } =
    sourceIndexesResponse.json<ListIndexResponse>();

  logger.info("Listing target indexes");
  const targetIndexesResponse =
    await $`algolia indices list -p ${RESELLER_ALGOLIA_PROFILE_NAME} -o json | tee ${TMP_PATH}target_indexes.json`;

  const { items: targetIndexes } =
    targetIndexesResponse.json<ListIndexResponse>();

  for (const sourceIndex of sourceIndexes) {
    const indexName = sourceIndex.name;
    logger.info("Validating index", { indexName });
    logger.info("Checking index for target mismatches", { indexName });
    const targetIndex = targetIndexes.find(
      ({ name }) => name === sourceIndex.name
    );
    if (!deepEqual(sourceIndex, targetIndex)) {
      logger.error("Source and target indexes do not match", {
        sourceIndex,
        targetIndex,
      });
    }
    logger.info("Checking index configuration match", { indexName });
  }
} catch (error) {
  logger.error("Validation failed", { error });
} finally {
  logger.info("Cleaning up Algolia CLI profiles");
  await $`algolia profile remove ${DC_ALGOLIA_PROFILE_NAME}`;
  await $`algolia profile remove ${RESELLER_ALGOLIA_PROFILE_NAME}`;
  logger.info("Validation complete");
}

// algolia indexes analyze
// Which Indexes have been migrated (From - To)
// -> list index for key
// -> check they exist in the reseller account
// -> record the number of records and check with the source (DC Algolia Search)
// -> export source And target config and diff

// How many records have been migrated (From - To)

// Configurations migrated (From - To)

// Replicas Migrated (From - To)
