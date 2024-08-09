# dc-algolia-search-migration-script

Script for migrating Dynamic Content search indexes to external reseller accounts.

## Prerequisites

- [Algolia CLI](https://www.algolia.com/doc/tools/cli/get-started/overview/#install-the-algolia-cli)
- Reseller Algolia API details
  - App Id
  - Write API Key
- Dynamic Content search index API details
  - App Id
  - API key - `listIndexes`, `browse`, `settings`

## Installation

```bash
nvm install
npm ci
```

## Setup Environment

Create a `.env` file using [./env.example](./env.example) as example.

| Env                            | Description                                                 | Notes                                              |
| ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------- |
| DC_ALGOLIA_INDEX_APP_ID        | App ID used to access DC search indexes                     |                                                    |
| DC_ALGOLIA_INDEX_API_KEY       | Api key with used to access DC search indexes               | Required ACL's `listIndexes`, `browse`, `settings` |
| RESELLER_ALGOLIA_INDEX_APP_ID  | App ID of the reseller Algolia app to migrate too           |                                                    |
| RESELLER_ALGOLIA_INDEX_API_KEY | "Write API Key" for the reseller app with write permissions |                                                    |

## Running a migration

```bash
npm run start
```
