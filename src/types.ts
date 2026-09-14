export type Tag = { category: string; label: string };
export type Person = {
  id: string;
  name: string;
  roles: string[];
  location: {
    city: string;
    lat: number;
    lng: number;
    evidence: string;
    inferred?: boolean;
  } | null;
  intro: string;
  tags: Tag[];
  date: string;
  sourceUrl: string;
  slackUrl: string;
  roleEvidence?: string;
};
export type Dataset = {
  updatedAt: string;
  source: string;
  messageCount: number;
  people: Person[];
};
