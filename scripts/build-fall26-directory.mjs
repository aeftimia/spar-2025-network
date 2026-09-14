import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { locationFrom } from "./extract.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const sourcePath = path.join(root, "data", "spar_fall_2026_introductions.json");
const slackPath = path.join(root, "data", "fall_2026_slack_metadata.json");
const outputPath = path.join(
  root,
  "public",
  "data",
  "spar_fall_2026_introductions.json",
);

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const slackMetadata = JSON.parse(fs.readFileSync(slackPath, "utf8"));
const slackByName = new Map(slackMetadata.people.map((p) => [p.name, p]));

const missing = source.people
  .filter((p) => !slackByName.has(p.name))
  .map((p) => p.name);
const extras = slackMetadata.people
  .filter((p) => !source.people.some((x) => x.name === p.name))
  .map((p) => p.name);

if (missing.length || extras.length) {
  throw new Error(
    `Fall 2026 Slack metadata mismatch. Missing: ${missing.join(", ") || "none"}. ` +
      `Extra: ${extras.join(", ") || "none"}.`,
  );
}

const people = source.people.map((person) => {
  const slack = slackByName.get(person.name);
  const mapped = person.location
    ? locationFrom(`based in ${person.location}`)
    : null;

  return {
    ...person,
    slack: {
      user_id: slack.user_id,
      message_ts: slack.message_ts,
      intro_date: slack.date,
      source_url: slack.source_url,
      profile_url: slack.profile_url,
      roles: slack.roles,
      role_evidence: slack.role_evidence,
    },
    map_location: mapped
      ? {
          city: mapped.city,
          lat: mapped.lat,
          lng: mapped.lng,
          evidence: `Derived from stated Fall 2026 location: ${person.location}`,
        }
      : null,
  };
});

const output = {
  ...source,
  generated_on: source.generated_on,
  scope: {
    ...source.scope,
    slack_metadata_note:
      "Slack user IDs, message timestamps, profile links, introduction permalinks, and explicit role evidence were refreshed directly from #introductions for the Fall 2026 run (2026-09-10 through 2026-09-13). Older cohorts are excluded.",
  },
  slack_source: {
    workspace: slackMetadata.workspace,
    channel_id: slackMetadata.channel_id,
    cohort_window: slackMetadata.cohort_window,
    matched_people: people.length,
  },
  people,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${people.length} Fall 2026 records to ${outputPath}`);
