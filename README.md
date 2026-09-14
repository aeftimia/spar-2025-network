# SPAR Common Ground

A small, login-free community map for `spar2025.slack.com`. React + Mantine, Leaflet, Vite, and SST. Filtering and shared-interest suggestions run entirely in the browser; there is no database or API server.

The source of truth for the current directory is `data/spar_fall_2026_introductions.json`, which contains the enriched Fall 2026 research/project metadata. Fresh Slack identity metadata for the same cohort lives in `data/fall_2026_slack_metadata.json`. Before development and production builds, `scripts/build-fall26-directory.mjs` merges those sources and writes both the full enriched public JSON and the `public/data/people.json` compatibility view consumed by the existing UI.

## Run

```sh
npm ci
npm run dev          # generates Fall 2026 public data, then starts Vite
npm run sst:dev      # SST development stage e2e with hot reload
npm test
npm run build        # regenerates Fall 2026 public data before building
npm run deploy       # production: https://spar2025.trekkit.io
```

SST needs your usual AWS credentials. The production domain uses Route 53 DNS for `trekkit.io`, an ACM certificate, S3, and CloudFront. Production resources are retained and protected; the e2e stage does not attach the production domain. SST manages the frontend command in dev mode. There are no application credentials in the frontend.

## Fall 2026 directory

The current roster contains 118 introductions from the Fall 2026 introduction run in `#introductions`, spanning September 10–13, 2026. Older SPAR cohorts are deliberately excluded.

The enriched source includes locations, descriptions, SPAR projects and project links, social/profile links, broader interests, research background, and normalized research tags. The taxonomy distinguishes methodological **means** (for example linear probing, activation engineering, sparse autoencoders, game theory) from safety/problem **ends** (for example deception, monitoring, reward hacking, biosecurity, or human agency). More specific tags are retained alongside canonical bridge tags so related researchers can still find one another despite different terminology.

Fresh Slack metadata was read directly from the Fall 2026 messages and matched to all 118 enriched records. It includes Slack user IDs, introduction timestamps/dates, message permalinks, profile URLs, and explicit role evidence. Mentor/mentee roles are only assigned when directly supported by the introduction; otherwise they remain unknown.

Run the merger directly with:

```sh
node scripts/build-fall26-directory.mjs
```

It produces:

- `public/data/spar_fall_2026_introductions.json` — the full enriched dataset plus fresh Slack metadata and city-level map locations where recognized.
- `public/data/people.json` — a compatibility projection for the current React UI, using the Fall 2026 roster and canonical means/ends/interests as filter tags.

The build fails if the Slack metadata and enriched roster do not match one-to-one, so a partial cohort refresh cannot silently ship.

## Slack refresh utilities

The older generic Slack import utilities are still available for ad-hoc extraction work:

```sh
npm run import:slack -- data/raw/introductions.txt
```

or, with a Slack API token:

```sh
SLACK_CHANNEL_IDS=C04NZ0MMSDV npm run sync:slack
```

These generic utilities are not currently the source of truth for the Fall 2026 enriched roster. If refreshing Fall 2026, update the enriched source and `data/fall_2026_slack_metadata.json` together and rerun the build merger.

## Data notes

- Locations are mapped only to city centroids, never addresses. Unrecognized or ambiguous locations remain available as text but stay off the map.
- The static directory JSON is public wherever the site is deployed, so do not add private contact information.
- Research tags are intended for discovery and conversation matching. Canonical tags provide broad bridges; fine-grained tags preserve the actual method/problem distinctions.
- Project and background-research metadata may come from introductions, SPAR project pages, and confidently matched public professional/research profiles; unresolved information is left empty rather than guessed.

Checkbox filters combine selected roles with any/all tag matching. Search and filters persist in shareable URLs. Map pins group everyone at the same coordinate, with all people accessible in the popup, and unmapped people remain available in the directory.

## Local examples followed

- `~/weather-notifier` and `~/trekkit.io`: Vite, React, Mantine provider/theme, Tabler icons, static hosting.
- `~/Documents/ChatGPT/Digman Inventory` (`farmstand`): e2e development stage, production retention/protection, domain isolated from dev.
- `~/kitchen-share` (`vivirents`): map lifecycle cleanup, map/list layout, shared selection, URL-backed search.

References: [SST StaticSite](https://sst.dev/docs/component/aws/static-site/), [SST CLI](https://sst.dev/docs/reference/cli/), [SST custom domains](https://sst.dev/docs/custom-domains/), [Mantine](https://mantine.dev/), [OpenStreetMap tile usage](https://operations.osmfoundation.org/policies/tiles/).
