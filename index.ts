import "dotenv/config";
import { $, echo, kill, ProcessOutput, question } from "zx";
import createLogger from "./src/logger/logger.js";
import { IndicesResponse } from "./src/types/indices.js";

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
  // can we make custom error more tidy in the terminal
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
await $`algolia profile add \
        --name ${DC_ALGOLIA_PROFILE_NAME} \
        --app-id ${DC_ALGOLIA_INDEX_APP_ID} \
        --api-key ${DC_ALGOLIA_INDEX_API_KEY}`;

// Create profile for Amplience Reseller indexes

// List all indices to process - algolia indices list
logger.info("Listing indices to be migrated");
const listIndicesOutput =
  await $`algolia indices list -p ${DC_ALGOLIA_PROFILE_NAME} -o json | tee ${TMP_PATH}list-indices-response.json`;

const { items: indices } = listIndicesOutput.json<IndicesResponse>();

const replicas = indices.reduce((replicas: string[], index) => {
  if (index?.replicas?.length > 0) {
    return [...replicas, ...index?.replicas];
  }
  return replicas;
}, []);
await $`echo ${replicas?.join(",\n")} > ${TMP_PATH}replica-list.txt`;

const primaries = indices
  .filter(({ name }) => !replicas.includes(name))
  .map(({ name }) => name);
await $`echo ${primaries?.join(",\n")} > ${TMP_PATH}primaries-list.txt`;

const hubNames = primaries.reduce((hubs: string[], index) => {
  const hubName = index.split(".")[0];
  if (!hubs.includes(hubName)) {
    return [...hubs, hubName];
  }
  return hubs;
}, []);

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
  // Foreach primary index
  // -> export objects from DC Algolia index
  // -> import objects into Amplience reseller index
  // -> export rules from DC Algolia index
  // -> import rules into Amplience reseller index
  // -> export synonyms from DC Algolia index
  // -> import synonyms into Amplience reseller index
  // -> export settings from DC Algolia index
  // -> import settings into Amplience reseller index

  // Foreach replica index
  // -> export rules from DC Algolia index
  // -> import rules into Amplience reseller index
  // -> export synonyms from DC Algolia index
  // -> import synonyms into Amplience reseller index
  // -> export settings from DC Algolia index
  // -> import settings into Amplience reseller index
  logger.info("Finished migration");
}

// Output results

// Cleanup
echo("Removing Algolia CLI profiles");
await $`algolia profile remove ${DC_ALGOLIA_PROFILE_NAME}`;
