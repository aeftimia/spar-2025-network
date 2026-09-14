import rawDirectory from "../data/spar_fall_2026_introductions.json";
import type { Dataset, Person, Tag } from "./types";

const tagsFor = (person: (typeof rawDirectory.people)[number]): Tag[] => [
  ...(person.research_tags?.means || []).map((label) => ({
    category: "Methods & approaches",
    label,
  })),
  ...(person.research_tags?.ends || []).map((label) => ({
    category: "Research goals",
    label,
  })),
  ...(person.interests || []).map((label) => ({
    category: "Outside research",
    label,
  })),
];

export const people: Person[] = rawDirectory.people.map((person) => ({
  id: person.slack?.user_id || person.name,
  name: person.name,
  roles: person.slack?.roles || ["mentee"],
  location: person.map_location || null,
  locationText: person.location || null,
  intro: person.description,
  tags: tagsFor(person),
  date: person.slack?.intro_date || rawDirectory.generated_on,
  sourceUrl: person.slack?.source_url || "",
  slackUrl: person.slack?.profile_url || "",
  roleEvidence: person.slack?.role_evidence || undefined,
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

export const dataset: Dataset = {
  updatedAt: rawDirectory.generated_on,
  source: rawDirectory.dataset,
  messageCount: people.length,
  people,
};

export { rawDirectory };
