# SPAR Common Ground

A small, login-free Fall 2026 SPAR community atlas built with React, Mantine, Mapbox GL JS, Vite, and SST. Filtering, search, and shared-interest discovery run entirely in the browser; there is no database or API server.

## Data model

`data/spar_fall_2026_introductions.json` is the single runtime directory contract. The React app imports that JSON directly; there is no `people.json` compatibility projection.

`data/fall_2026_slack_metadata.json` is raw refresh/provenance input only. Before dev/build, `scripts/build-fall26-directory.mjs` audits the enriched JSON in place and merges the fresh Fall 2026 Slack identity metadata into each person record. The script validates a one-to-one match across all 118 people and fails rather than silently shipping a partial cohort.

The audit keeps three distinct discovery concepts:

- `research_tags.means`: methods, disciplines, and research approaches.
- `research_tags.ends`: research problems, safety goals, failure modes, and application objectives.
- `interests`: non-research personal/common-ground interests only.

Fine-grained `specific_means` / `specific_ends` remain available for precise matching. Redundant broad canonical parent tags are omitted from individual records when a more specific child is already present; the hierarchy remains in the top-level taxonomy for matching.

## Run

```sh
npm ci
npm run dev          # audits/merges the canonical JSON, then starts Vite
npm run sst:dev      # SST development stage with hot reload
npm test
npm run build        # audits/merges the canonical JSON before building
npm run deploy       # production: https://spar2025.trekkit.io
```

SST injects `VITE_PUBLIC_MAPBOX_TOKEN` using `MapboxAccessToken` when `$dev` is true and `MapboxAccessTokenProd` otherwise.

## Map behavior

Pins are rendered as Mapbox GeoJSON symbol layers rather than DOM markers, so they remain attached to geography while panning, rotating, or pitching. Purple pins indicate mentors and teal pins indicate mentees; explicit mentors remain mentors and other Fall 2026 introducers are treated as mentees.

On initial map load, the browser requests location permission. If granted, the map shows a small local-only user-location dot and frames roughly a 50-mile radius around the user. That location is not written to the directory or sent to the app backend (there is no backend). If permission is unavailable or denied, the map falls back to fitting the cohort pins. Selecting a person frames roughly a 50-mile region around their stated city-level location, and “Fit everyone” returns to the full cohort view.

Participant locations are city centroids only, never precise addresses. Ambiguous/unrecognized locations remain searchable as text but stay off the map.

## Fall 2026 directory

The roster contains 118 introductions from the September 10–13, 2026 Fall 2026 introduction run in `#introductions`; older cohorts are deliberately excluded. Fresh Slack metadata includes user IDs, introduction timestamps/dates, message permalinks, profile links, and role evidence. Project/background metadata may additionally come from SPAR project pages and confidently matched public professional or research profiles; unresolved information is left empty rather than guessed.

## Refresh utilities

To rerun the canonical merge/audit directly:

```sh
node scripts/build-fall26-directory.mjs
```

Generic Slack import utilities remain available for refreshing source material:

```sh
npm run import:slack -- data/raw/introductions.txt
SLACK_CHANNEL_IDS=C04NZ0MMSDV npm run sync:slack
```

When refreshing Fall 2026, update the enriched source and fresh Slack metadata together, then run the audit/merge before committing.

## Local examples followed

The Mapbox implementation intentionally follows the `aeftimia/kitchen-share` approach: a persistent Mapbox instance, GeoJSON sources, symbol-layer pins, and map-native click handling rather than HTML markers.

References: [SST](https://sst.dev/), [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/), [Mantine](https://mantine.dev/).
