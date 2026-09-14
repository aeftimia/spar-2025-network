import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { locationFrom } from "./extract.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const sourcePath = path.join(root, "data", "spar_fall_2026_introductions.json");
const slackPath = path.join(root, "data", "fall_2026_slack_metadata.json");

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

const PERSONAL_INTEREST_ALIASES = new Map([
  ["movies", "film"],
  ["vegan cooking", "cooking"],
]);
const PERSONAL_INTERESTS = new Set([
  "FPS esports",
  "Spanish",
  "art",
  "baking",
  "board games",
  "bouldering",
  "chess",
  "cities",
  "coffee",
  "cooking",
  "electronic music",
  "film",
  "football",
  "gaming",
  "graphic design",
  "gym",
  "home labs",
  "house concerts",
  "jazz guitar",
  "jewelry",
  "meditation",
  "mountain biking",
  "music production",
  "mysteries",
  "outdoors",
  "photography",
  "pool",
  "reading",
  "rock climbing",
  "running",
  "science fiction",
  "skateboarding",
  "space",
  "sports",
  "swimming",
  "swing dancing",
  "triathlon",
  "trivia",
  "writing",
]);

const MEANS_PARENTS = {
  interpretability: new Set([
    "mechanistic interpretability",
    "sparse autoencoders",
    "circuit analysis",
    "attention analysis",
    "representation analysis",
    "probing",
    "activation prediction & proxying",
    "chain-of-thought analysis",
  ]),
  "evaluation & benchmarking": new Set([
    "agent evaluation",
    "multi-agent evaluation",
    "AI judges",
  ]),
  monitoring: new Set(["compute monitoring"]),
};

const ENDS_PARENTS = {
  "AI security": new Set(["agent security"]),
  "AI safety": new Set([
    "agent safety",
    "model safety mechanisms",
    "multi-agent safety",
    "AI safety field-building",
  ]),
  "monitoring & oversight": new Set([
    "scalable oversight",
    "chain-of-thought monitorability",
  ]),
  "AI governance": new Set(["compute governance", "lab governance"]),
  "model understanding": new Set(["evaluation & situational awareness"]),
};

const SPECIFIC_TO_ENDS = new Set([
  "congressional oversight",
  "deception detection",
  "evaluation awareness",
  "oversight evasion",
  "prompt injection",
  "scalable oversight",
  "temporal representations",
]);
const SPECIFIC_TO_MEANS = new Set([
  "field-building",
  "interpretability",
  "monitoring",
  "research synthesis",
]);

const dedupe = (xs = []) => [...new Set(xs)];
const intersects = (a, b) => {
  const rhs = new Set(b);
  return a.some((value) => rhs.has(value));
};

function pruneParents(tags, hierarchy) {
  return tags.filter((tag) => {
    const children = hierarchy[tag];
    return !children || !tags.some((candidate) => children.has(candidate));
  });
}

function auditResearchTags(researchTags = {}, stats) {
  const originalMeans = dedupe(researchTags.means);
  const originalEnds = dedupe(researchTags.ends);
  let means = pruneParents(originalMeans, MEANS_PARENTS);
  let ends = pruneParents(originalEnds, ENDS_PARENTS);
  let specificMeans = dedupe(researchTags.specific_means);
  let specificEnds = dedupe(researchTags.specific_ends);

  stats.redundantParents +=
    originalMeans.length + originalEnds.length - means.length - ends.length;

  for (const tag of [...specificMeans]) {
    if (!SPECIFIC_TO_ENDS.has(tag)) continue;
    specificMeans = specificMeans.filter((x) => x !== tag);
    if (!specificEnds.includes(tag)) specificEnds.push(tag);
    stats.movedToEnds += 1;
  }
  for (const tag of [...specificEnds]) {
    if (!SPECIFIC_TO_MEANS.has(tag)) continue;
    specificEnds = specificEnds.filter((x) => x !== tag);
    if (!specificMeans.includes(tag)) specificMeans.push(tag);
    stats.movedToMeans += 1;
  }

  return {
    means,
    ends,
    specific_means: specificMeans,
    specific_ends: specificEnds,
  };
}

function auditPersonalInterests(interests = []) {
  const normalized = interests.map((interest) =>
    PERSONAL_INTEREST_ALIASES.get(interest) || interest,
  );
  return dedupe(normalized.filter((interest) => PERSONAL_INTERESTS.has(interest)));
}

const cohortRoles = (slack) =>
  slack.roles.includes("mentor") ? ["mentor"] : ["mentee"];

const runStats = {
  removedInterestValues: 0,
  redundantParents: 0,
  movedToEnds: 0,
  movedToMeans: 0,
};

const people = source.people.map((person) => {
  const slack = slackByName.get(person.name);
  const mapped = person.map_location || (person.location
    ? locationFrom(`based in ${person.location}`)
    : null);
  const roles = cohortRoles(slack);

  const previousInterests = person.interests || [];
  const interests = auditPersonalInterests(previousInterests);
  runStats.removedInterestValues += previousInterests.length - interests.length;

  return {
    ...person,
    interests,
    research_tags: auditResearchTags(person.research_tags, runStats),
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
    map_location: person.map_location || (mapped
      ? {
          city: mapped.city,
          lat: mapped.lat,
          lng: mapped.lng,
          evidence: `Derived from stated Fall 2026 location: ${person.location}`,
        }
      : null),
  };
});

function tagCounts(key) {
  const counts = new Map();
  for (const person of people) {
    for (const tag of person.research_tags[key] || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function pairwiseConnectivity() {
  let sharedCanonicalMeans = 0;
  let sharedCanonicalEnds = 0;
  let sharedSpecificMeans = 0;
  let sharedSpecificEnds = 0;
  for (let i = 0; i < people.length; i += 1) {
    for (let j = i + 1; j < people.length; j += 1) {
      const a = people[i].research_tags;
      const b = people[j].research_tags;
      if (intersects(a.means, b.means)) sharedCanonicalMeans += 1;
      if (intersects(a.ends, b.ends)) sharedCanonicalEnds += 1;
      if (intersects(a.specific_means, b.specific_means)) sharedSpecificMeans += 1;
      if (intersects(a.specific_ends, b.specific_ends)) sharedSpecificEnds += 1;
    }
  }
  return {
    possible_pairs: (people.length * (people.length - 1)) / 2,
    shared_canonical_means: sharedCanonicalMeans,
    shared_canonical_ends: sharedCanonicalEnds,
    shared_specific_means: sharedSpecificMeans,
    shared_specific_ends: sharedSpecificEnds,
  };
}

const personalInterestVocabulary = [
  ...new Set(people.flatMap((person) => person.interests || [])),
].sort();
const previousAudit = source.tag_audit || {};
const accumulatedAudit = {
  interest_values_removed_as_research_or_professional: Math.max(
    previousAudit.interest_values_removed_as_research_or_professional || 0,
    runStats.removedInterestValues,
  ),
  redundant_canonical_parent_tags_removed: Math.max(
    previousAudit.redundant_canonical_parent_tags_removed || 0,
    runStats.redundantParents,
  ),
  specific_tags_moved_to_ends: Math.max(
    previousAudit.specific_tags_moved_to_ends || 0,
    runStats.movedToEnds,
  ),
  specific_tags_moved_to_means: Math.max(
    previousAudit.specific_tags_moved_to_means || 0,
    runStats.movedToMeans,
  ),
};

const output = {
  ...source,
  scope: {
    ...source.scope,
    note:
      "Only introductions visible in the current Fall 2026 introduction run are included. Research tags are normalized for conversation matching; interests are reserved for clearly non-research personal/common-ground interests.",
    slack_metadata_note:
      "Slack user IDs, message timestamps, profile links, introduction permalinks, and role metadata were refreshed directly from #introductions for the Fall 2026 run (2026-09-10 through 2026-09-13). Explicit mentors remain mentors; all other Fall 2026 introducers are treated as mentees. Older cohorts are excluded.",
  },
  tag_semantics: {
    means:
      "Controlled-vocabulary methods, disciplines, and research approaches. Redundant broad parents are omitted from individual records when a more specific canonical child is already present.",
    ends:
      "Controlled-vocabulary research problems, safety goals, failure modes, and application objectives. Redundant broad parents are omitted from individual records when a more specific canonical child is already present.",
    specific_means:
      "Fine-grained methods, tools, and approaches supported by an introduction, project page, or confidently matched public research profile.",
    specific_ends:
      "Fine-grained research problems, failure modes, safety goals, and application areas supported by an introduction, project page, or confidently matched public research profile.",
    interests:
      "Clearly non-research personal/common-ground interests only. Research topics belong in research_tags or background_research_interests.",
    background_research_interests:
      "Longer-run research interests/background inferred only from confidently matched public professional or research sources; empty when external evidence was not reliable enough.",
  },
  slack_source: {
    workspace: slackMetadata.workspace,
    channel_id: slackMetadata.channel_id,
    cohort_window: slackMetadata.cohort_window,
    matched_people: people.length,
  },
  people,
  tag_taxonomy: {
    ...source.tag_taxonomy,
    canonical_means: tagCounts("means"),
    canonical_ends: tagCounts("ends"),
  },
  tag_audit: {
    reviewed_on: "2026-09-13",
    people: people.length,
    ...accumulatedAudit,
    personal_interest_vocabulary_size: personalInterestVocabulary.length,
    personal_interest_vocabulary: personalInterestVocabulary,
    specific_tag_side_corrections: {
      moved_to_ends: [...SPECIFIC_TO_ENDS].sort(),
      moved_to_means: [...SPECIFIC_TO_MEANS].sort(),
    },
    design_note:
      "Hierarchy relationships remain in tag_taxonomy for matching, but individual records avoid repeating broad parent tags when a more specific canonical child is already present.",
  },
  final_review_audit: {
    ...source.final_review_audit,
    records: people.length,
    canonical_means_vocabulary_size: Object.keys(tagCounts("means")).length,
    canonical_ends_vocabulary_size: Object.keys(tagCounts("ends")).length,
    pairwise_connectivity: pairwiseConnectivity(),
    design_note:
      "Canonical tags are bridge concepts for discovery, but redundant hierarchy parents are no longer repeated on individual records. specific_means/specific_ends retain precise distinctions; use rarity/IDF weighting so broad tags do not dominate recommendations.",
  },
};

fs.writeFileSync(sourcePath, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `Prepared ${people.length} Fall 2026 records in-place at ${sourcePath}; ${personalInterestVocabulary.length} personal-interest labels remain after audit.`,
);
