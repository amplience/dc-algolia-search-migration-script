import "dotenv/config";
import { $, echo, kill, question } from "zx";

const {
  DC_ALGOLIA_INDEX_APP_ID,
  DC_ALGOLIA_INDEX_API_KEY,
  RESELLER_ALGOLIA_INDEX_APP_ID,
  RESELLER_ALGOLIA_INDEX_API_KEY,
} = process.env;

const DC_ALGOLIA_PROFILE_NAME = "dc_algolia_profile";
const RESELLER_ALGOLIA_PROFILE_NAME = "reseller_algolia_profile";

echo("Checking for Algolia CLI");
try {
  await $`algolia --help`;
} catch (e) {
  // can we make custom error more tidy in the terminal
  throw new Error(
    "Algolia CLI not installed: https://www.algolia.com/doc/tools/cli/get-started/overview/#install-the-algolia-cli"
  );
}

echo("Checking profiles information is available");
if (
  !DC_ALGOLIA_INDEX_APP_ID ||
  !DC_ALGOLIA_INDEX_API_KEY ||
  !RESELLER_ALGOLIA_INDEX_APP_ID ||
  !RESELLER_ALGOLIA_INDEX_API_KEY
) {
  throw new Error("Required profile data missing");
}

echo("Creating Algolia CLI profile for DC Algolia");
await $`algolia profile add \
        --name ${DC_ALGOLIA_PROFILE_NAME} \
        --app-id ${DC_ALGOLIA_INDEX_APP_ID} \
        --api-key ${DC_ALGOLIA_INDEX_API_KEY}`;

// Create profile for Amplience Reseller indexes

// List all indexes to process - algolia indices list
echo("Listing indicies to be migrated");
const indicies = await $`algolia indices list -p ${DC_ALGOLIA_PROFILE_NAME}`;
echo(indicies);
// Process list of indexes in to primary and replicas

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

// Output results

// Cleanup
// -> delete profiles???
echo("Removing Algolia CLI profile for DC Algolia");
await $`algolia profile remove ${DC_ALGOLIA_PROFILE_NAME}`;
