import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extract, parseConnector, universe2025 } from "./extract.mjs";
const input = process.argv[2] || "data/raw/introductions.txt";
let overrides = {};
try {
  overrides = JSON.parse(await readFile("data/overrides.json", "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const raw = await readFile(input, "utf8");
const rawMessages = input.endsWith(".json")
  ? JSON.parse(raw)
  : parseConnector(raw);
if (!Array.isArray(rawMessages) || !rawMessages.length)
  throw new Error(
    "No Slack messages found. Supply a connector transcript or Slack message JSON array.",
  );
const messages = universe2025(rawMessages);
if (!messages.length)
  throw Error("No 2025 introductions found; existing dataset unchanged.");
const people = extract(messages, overrides);
await mkdir("public/data", { recursive: true });
await writeFile(
  "public/data/people.json",
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      source: "spar2025.slack.com · #introductions",
      messageCount: messages.length,
      people,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Imported ${people.length} people from ${messages.length} messages; ${people.filter((p) => p.location).length} city locations; ${people.filter((p) => p.roles.includes("mentor")).length} mentors; ${people.filter((p) => p.roles.includes("mentee")).length} mentees.`,
);
