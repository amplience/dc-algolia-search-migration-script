import "dotenv/config";
import { $, question } from "zx";
import createLogger from "./src/logger/logger.js";
import { IndicesResponse } from "./src/indices/indices.types.js";
import { extractHubNames } from "./src/indices/extract-hub-names.js";
import { extractReplicaIndexNames } from "./src/indices/extract-replica-index-names.js";
import { extractPrimaryIndexNames } from "./src/indices/extract-primary-index-names.js";

const TIMESTAMP = new Date()
  .toISOString()
  .replace(/[^0-9]/g, "")
  .slice(0, -3);

const TMP_PATH = `./.tmp/${TIMESTAMP}/`;
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
  logger.info("Listing indices to be migrated");
  const listIndicesOutput =
    await $`algolia indices list -p ${DC_ALGOLIA_PROFILE_NAME} -o json | tee ${TMP_PATH}list-indices-response.json`;

  const { items: indices } = listIndicesOutput.json<IndicesResponse>();

  const replicas = extractReplicaIndexNames(indices);
  await $`echo ${replicas?.join(",\n")} > ${TMP_PATH}replica-list.txt`;

  const primaries = extractPrimaryIndexNames(indices);
  await $`echo ${primaries?.join(",\n")} > ${TMP_PATH}primaries-list.txt`;

  const hubNames = extractHubNames(indices);
  logger.info(
    `Found ${primaries.length} primary and ${
      replicas.length
    } replicas to migrate from the hubs: ${hubNames.join(", ")}`
  );

  logger.info(
    `Please review the list of indices and replicas to be migrate: ${TMP_PATH}primaries-list.txt, ${TMP_PATH}replica-list.txt`
  );
  const proceedAnswer = await question(
    "Would you like to proceed with the migration? (y/N)"
  );

  if (proceedAnswer.toLowerCase() === "y") {
    logger.info("Starting migration");

    logger.info("Migrating primary indices");
    for (const index of primaries) {
      logger.info("Migrating primary index", { index });
      logger.info(`Exporting index objects`, { index });
      await $`algolia objects browse ${index} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${index}_objects_export.ndjson`;
      logger.info(`Importing index objects`, { index });
      await $`algolia objects import ${index} -p ${RESELLER_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${index}_objects_export.ndjson`;
      logger.info(`Exporting index rules`, { index });
      await $`algolia rules browse ${index} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${index}_rules_export.ndjson`;
      logger.info(`Importing index rules`, { index });
      await $`algolia rules import ${index} -p ${RESELLER_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${index}_rules_export.ndjson`;
      logger.info(`Exporting index synonyms`, { index });
      await $`algolia synonyms browse ${index} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${index}_synonyms_export.ndjson`;
      logger.info(`Importing index synonyms`, { index });
      await $`algolia synonyms import ${index} -p ${RESELLER_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${index}_synonyms_export.ndjson`;
      logger.info(`Exporting index settings`, { index });
      await $`algolia settings get ${index} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${index}_settings_export.ndjson`;
      logger.info(`Importing index settings`, { index });
      await $`algolia settings import ${index} -p ${RESELLER_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${index}_settings_export.ndjson`;
      logger.info("Done migrating primary index", { index });
    }

    logger.info("Migrating replica indices");
    for (const replica of replicas) {
      logger.info("Migrating replica index", { replica });
      await $`algolia rules browse ${replica} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${replica}_rules_export.ndjson`;
      logger.info(`Importing index rules`, { replica });
      await $`algolia rules import ${replica} -p ${RESELLER_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${replica}_rules_export.ndjson`;
      logger.info(`Exporting index synonyms`, { replica });
      await $`algolia synonyms browse ${replica} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${replica}_synonyms_export.ndjson`;
      logger.info(`Importing index synonyms`, { replica });
      await $`algolia synonyms import ${replica} -p ${RESELLER_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${replica}_synonyms_export.ndjson`;
      logger.info(`Exporting index settings`, { replica });
      await $`algolia settings get ${replica} -p ${DC_ALGOLIA_PROFILE_NAME} > ${TMP_PATH}${replica}_settings_export.ndjson`;
      logger.info(`Importing index settings`, { replica });
      await $`algolia settings import ${replica} -p ${RESELLER_ALGOLIA_PROFILE_NAME} -F ${TMP_PATH}${replica}_settings_export.ndjson`;
      logger.info("Done migrating replica index", { replica });
    }

    logger.info("Finished migration");
  }
} catch (error) {
  logger.error("Migration failed", { error });
} finally {
  logger.info("Removing Algolia CLI profiles");
  await $`algolia profile remove ${DC_ALGOLIA_PROFILE_NAME}`;
  await $`algolia profile remove ${RESELLER_ALGOLIA_PROFILE_NAME}`;
  logger.info("Migration script complete");
}
