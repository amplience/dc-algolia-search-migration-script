# dc-algolia-search-migration-script

Script for migrating Dynamic Content search indexes to external accounts.

## Prerequisites

- [Algolia CLI](https://www.algolia.com/doc/tools/cli/get-started/overview/#install-the-algolia-cli)

- Dynamic Content search index API details
  - App Id
  - API key - `listIndexes`, `browse`, `settings`
- Target Algolia API details
  - App Id
  - Write API Key

## Installation

```bash
nvm install
npm ci
```

## Setup Environment

Create a `.env` file using [./env.example](./env.example) as example.

| Env                          | Description                                               | Notes                                              |
| ---------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| DC_ALGOLIA_INDEX_APP_ID      | App ID used to access DC search indexes                   |                                                    |
| DC_ALGOLIA_INDEX_API_KEY     | Api key with used to access DC search indexes             | Required ACL's `listIndexes`, `browse`, `settings` |
| TARGET_ALGOLIA_INDEX_APP_ID  | App ID of the target Algolia app to migrate too           |                                                    |
| TARGET_ALGOLIA_INDEX_API_KEY | "Write API Key" for the target app with write permissions |                                                    |

## Migrating indexes

### What does the script migrate

The script will migrate the following.

- For each primary index we migrate:
  - Objects
  - Rules
  - Synonyms
  - Settings
- For each replica index we migrated:
  - Rules
  - Synonyms
  - Settings

### Starting a migration

```bash
npm run migrate
```

### Migration output

The migration script will output an number of migration files that can be used to review, validate, and debug a migration. The following migration files can be found in the tmp location `./tmp/migrate/{YYYYMMDDhhmmss}`:

- `combined.log` - All migration logs
- `error.log` - Error logs
- `source_indexes.json` - A list of indexes returned from the Algolia CLI for the supplied API key
- `primary-index-list.txt` - The list of primary indexes to be migrated
- `replica-index-list.txt` - The list of replica indexes to be migrated
- `{hubname}.{indexname}_objects_export.ndjson` - Algolia CLI index objects export file
- `{hubname}.{indexname}_rules_export.ndjson` - Algolia CLI index rules export file
- `{hubname}.{indexname}_synonyms_export.ndjson` - Algolia CLI index synonyms export file
- `{hubname}.{indexname}_settings_export.ndjson` - Algolia CLI index settings export file

## Validating migrated indexes

```bash
npm run validate
```

### Validation output

The validation script will output an number of migration files that can be used to review, validate, and debug a migration. The following validation files can be found in the tmp location `./tmp/validate/{YYYYMMDDhhmmss}`:

- `combined.log` - All migration logs
- `error.log` - Error logs
- `source_indexes.json` - A list of source indexes returned from the Algolia CLI for the supplied API key
- `target_indexes.json` - A list of target indexes returned from the Algolia CLI for the supplied API key
- `{hubname}.{indexname}_source_rules_export.ndjson` - Algolia CLI source index rules export file
- `{hubname}.{indexname}_source_synonyms_export.ndjson` - Algolia CLI source index synonyms export file
- `{hubname}.{indexname}_source_settings_export.ndjson` - Algolia CLI source index settings export file
- `{hubname}.{indexname}_target_rules_export.ndjson` - Algolia CLI target index rules export file
- `{hubname}.{indexname}_target_synonyms_export.ndjson` - Algolia CLI target index synonyms export file
- `{hubname}.{indexname}_target_settings_export.ndjson` - Algolia CLI target index settings export file

## Running tests

```bash
npm run test
```
