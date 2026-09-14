# SPAR Common Ground

A small, login-free community map for `spar2025.slack.com`. React + Mantine, Leaflet, Vite, and SST. The entire directory is `public/data/people.json`; filtering and shared-interest suggestions run in the browser. No database, API server, or background jobs.

## Run

```sh
npm ci
npm run dev          # Vite only, no AWS needed
npm run sst:dev      # SST development stage e2e with hot reload
npm test
npm run build
npm run deploy      # production: https://spar2025.trekkit.io
```

SST needs your usual AWS credentials. The production domain uses Route 53 DNS for `trekkit.io`, an ACM certificate, S3, and CloudFront. Production resources are retained and protected; the e2e stage does not attach the production domain. SST manages the frontend command in dev mode. There are no application credentials in the frontend.

## Refresh the directory

The initial snapshot was read through the Slack connector from all 384 available top-level messages in `#introductions` on September 13, 2026. It keeps the most recent substantive introduction per Slack user (369 people). Thread replies are not imported. The snapshot spans multiple years; filter by introduction year when recency matters. It is not a live roster of current SPAR participants.

To import a connector transcript stored locally:

```sh
npm run import:slack -- data/raw/introductions.txt
```

Alternatively, use a Slack JSON array with `{ user, name, text, ts, channel }` fields. `name` and `channel` are optional; normal Slack exports need names added from their `users.json` file. Missing names remain user IDs rather than invented identities.

For a repeatable API refresh:

```sh
# Set SLACK_TOKEN securely in your shell first.
SLACK_CHANNEL_IDS=C04NZ0MMSDV npm run sync:slack
npm run build
npm run deploy
```

The token needs `channels:history` and `users:read`, plus membership in the source channel. Private channels also require `groups:history`. The script follows pagination, handles rate limits, resolves display names, and only overwrites the directory after a successful fetch. Raw imports and `.env` files are gitignored and are not copied into the build.

## Extraction and corrections

- Tags use a small, editable vocabulary in `scripts/extract.mjs`, grouped into research, projects, tooling, objectives, and interests. They describe text matches, not verified expertise.
- Mentor/mentee labels require explicit introduction evidence. Many introductions don't state a role and remain in “Role not stated.” Do not assume every student is a mentee.
- Locations use a local city dictionary and current-location phrases, avoiding birthplace, former schools, and planned travel. Unmatched/ambiguous locations stay off the map and remain in the directory.
- Four manually reviewed university affiliations are mapped as **inferred** city locations. Their evidence is visible on profile cards. All pins are city centroids, never addresses.
- `data/overrides.json` supports reviewed corrections by Slack user ID. Set `location` to `null` to unmap someone, supply `roles`, or replace tags. Review overrides on refresh: they intentionally persist.
- Full introduction text (with emails removed), source dates, and Slack permalinks remain available for context. The static JSON is public wherever deployed.

Checkbox filters combine selected roles with any/all tag matching. Search, roles, tag matching, introduction year, and location filters persist in shareable URLs. Map pins group everyone at the same coordinate, with all people accessible in the popup. The directory also includes unmapped people.

## Local examples followed

- `~/weather-notifier` and `~/trekkit.io`: Vite, React, Mantine provider/theme, Tabler icons, static hosting.
- `~/Documents/ChatGPT/Digman Inventory` (`farmstand`): e2e development stage, production retention/protection, domain isolated from dev.
- `~/kitchen-share` (`vivirents`): map lifecycle cleanup, map/list layout, shared selection, URL-backed search.

References: [SST StaticSite](https://sst.dev/docs/component/aws/static-site/), [SST CLI](https://sst.dev/docs/reference/cli/), [SST custom domains](https://sst.dev/docs/custom-domains/), [Mantine](https://mantine.dev/), [OpenStreetMap tile usage](https://operations.osmfoundation.org/policies/tiles/).
# spar-2025-network
