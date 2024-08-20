import "dotenv/config";
import { $, question } from "zx";
import createLogger from "../logger/logger.js";
import { ListIndexResponse } from "../algolia-cli/types/list-index-response.types.js";
import { extractReplicaIndexNames } from "../algolia-cli/list-index-response/extract-replica-index-names.js";
import { extractPrimaryIndexNames } from "../algolia-cli/list-index-response/extract-primary-index-names.js";
import { extractHubNames } from "../algolia-cli/list-index-response/extract-hub-names.js";

const TIMESTAMP = new Date()
  .toISOString()
  .replace(/[^0-9]/g, "")
  .slice(0, -3);

const TMP_PATH = `./.tmp/migrate/${TIMESTAMP}/`;
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
  logger.info("Listing indexes to be migrated");
  const listIndexesOutput =
    await $`algolia indices list -p ${DC_ALGOLIA_PROFILE_NAME} -o json | tee ${TMP_PATH}source_indexes.json`;

  const { items: indexes } = listIndexesOutput.json<ListIndexResponse>();

  const replicas = extractReplicaIndexNames(indexes);
  await $`echo ${replicas?.join(",\n")} > ${TMP_PATH}replica-index-list.txt`;

  const primaries = extractPrimaryIndexNames(indexes);
  await $`echo ${primaries?.join(",\n")} > ${TMP_PATH}primary-index-list.txt`;

  const hubNames = extractHubNames(indexes);
  logger.info(
    `Found ${primaries.length} primary and ${
      replicas.length
    } replicas to migrate from the hubs: ${hubNames.join(", ")}`
  );

  logger.info(
    `Please review the list of indexes and replicas to be migrate: ${TMP_PATH}primary-index-list.txt, ${TMP_PATH}replica-index-list.txt`
  );
  const proceedAnswer = await question(
    "Would you like to proceed with the migration? (y/N)"
  );

  if (proceedAnswer.toLowerCase() === "y") {
    logger.info("Starting migration");

    logger.info("Migrating primary indexes");
    for (const index of primaries) {
      logger.info(`Exporting index objects`, { index });
      await $`algolia objects browse ${index} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${index}_objects_export.ndjson`;
      logger.info(`Importing index objects`, { index });
      await $`algolia objects import ${index} -p ${TARGET_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${index}_objects_export.ndjson`;
      logger.info(`Migrating index rules`, { index });
      await $`algolia rules browse ${index} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${index}_rules_export.ndjson`;
      await $`algolia rules import ${index} -p ${TARGET_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${index}_rules_export.ndjson`;
      logger.info(`Migrating index synonyms`, { index });
      await $`algolia synonyms browse ${index} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${index}_synonyms_export.ndjson`;
      await $`algolia synonyms import ${index} -p ${TARGET_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${index}_synonyms_export.ndjson`;
      logger.info(`Migrating index settings`, { index });
      await $`algolia settings get ${index} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${index}_settings_export.ndjson`;
      await $`algolia settings import ${index} -p ${TARGET_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${index}_settings_export.ndjson`;
      logger.info("Done migrating primary index", { index });
    }

    logger.info("Migrating replica indexes");
    for (const replica of replicas) {
      logger.info(`Migrating replica rules`, { replica });
      await $`algolia rules browse ${replica} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${replica}_rules_export.ndjson`;
      await $`algolia rules import ${replica} -p ${TARGET_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${replica}_rules_export.ndjson`;
      logger.info(`Migrating index synonyms`, { replica });
      await $`algolia synonyms browse ${replica} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${replica}_synonyms_export.ndjson`;
      await $`algolia synonyms import ${replica} -p ${TARGET_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${replica}_synonyms_export.ndjson`;
      logger.info(`Migrating index settings`, { replica });
      await $`algolia settings get ${replica} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${replica}_settings_export.ndjson`;
      await $`algolia settings import ${replica} -p ${TARGET_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${replica}_settings_export.ndjson`;
      logger.info("Done migrating replica index", { replica });
    }

    logger.info("Finished migration");
  }
} catch (error) {
  logger.error("Migration failed", { error });
} finally {
  logger.info("Cleaning up Algolia CLI profiles");
  await $`algolia profile remove ${DC_ALGOLIA_PROFILE_NAME}`;
  await $`algolia profile remove ${TARGET_ALGOLIA_PROFILE_NAME}`;
  logger.info("Migration script complete");
}
