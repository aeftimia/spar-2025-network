import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { locationFrom } from "./extract.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const sourcePath = path.join(root, "data", "spar_fall_2026_introductions.json");
const slackPath = path.join(root, "data", "fall_2026_slack_metadata.json");
const fullOutputPath = path.join(
  root,
  "public",
  "data",
  "spar_fall_2026_introductions.json",
);
const compatibilityOutputPath = path.join(root, "public", "data", "people.json");

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

const dedupeTags = (tags) => [
  ...new Map(tags.map((tag) => [`${tag.category}:${tag.label}`, tag])).values(),
];

const cohortRoles = (slack) =>
  slack.roles.includes("mentor") ? ["mentor"] : ["mentee"];

const people = source.people.map((person) => {
  const slack = slackByName.get(person.name);
  const mapped = person.location
    ? locationFrom(`based in ${person.location}`)
    : null;
  const roles = cohortRoles(slack);

  return {
    ...person,
    slack: {
      user_id: slack.user_id,
      message_ts: slack.message_ts,
      intro_date: slack.date,
      source_url: slack.source_url,
      profile_url: slack.profile_url,
      roles,
      role_evidence:
        slack.role_evidence ||
        (roles.includes("mentee")
          ? "Fall 2026 #introductions participant; non-mentor introductions are treated as mentees for this cohort."
          : null),
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
  scope: {
    ...source.scope,
    slack_metadata_note:
      "Slack user IDs, message timestamps, profile links, introduction permalinks, and role metadata were refreshed directly from #introductions for the Fall 2026 run (2026-09-10 through 2026-09-13). Explicit mentors remain mentors; all other Fall 2026 introducers are treated as mentees. Older cohorts are excluded.",
  },
  slack_source: {
    workspace: slackMetadata.workspace,
    channel_id: slackMetadata.channel_id,
    cohort_window: slackMetadata.cohort_window,
    matched_people: people.length,
  },
  people,
};

const compatibilityPeople = people.map((person) => ({
  id: person.slack.user_id,
  name: person.name,
  roles: person.slack.roles,
  location: person.map_location,
  locationText: person.location,
  intro: person.description,
  tags: dedupeTags([
    ...(person.research_tags?.means || []).map((label) => ({
      category: "Research",
      label,
    })),
    ...(person.research_tags?.ends || []).map((label) => ({
      category: "Objectives",
      label,
    })),
    ...(person.interests || []).map((label) => ({
      category: "Interests",
      label,
    })),
  ]),
  date: person.slack.intro_date,
  sourceUrl: person.slack.source_url,
  slackUrl: person.slack.profile_url,
  roleEvidence: person.slack.role_evidence || undefined,
  project: person.project || null,
  projectUrl: person.project_url || null,
  projectUrls: person.project_urls || [],
  socialMedia: person.social_media || {},
  websites: person.websites || [],
  interests: person.interests || [],
  backgroundResearchInterests: person.background_research_interests || [],
  specificMeans: person.research_tags?.specific_means || [],
  specificEnds: person.research_tags?.specific_ends || [],
}));

const compatibilityOutput = {
  updatedAt: new Date().toISOString(),
  source: "SPAR Fall 2026 Slack introductions + enriched research metadata",
  messageCount: compatibilityPeople.length,
  people: compatibilityPeople,
};

fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });
fs.writeFileSync(fullOutputPath, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(
  compatibilityOutputPath,
  `${JSON.stringify(compatibilityOutput, null, 2)}\n`,
);
console.log(
  `Wrote ${people.length} Fall 2026 records to ${fullOutputPath} and ${compatibilityOutputPath}`,
);
