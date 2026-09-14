// Optional repeatable refresh with a read-only Slack token. Never used by the browser.
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const token = process.env.SLACK_TOKEN;
if (!token)
  throw Error(
    "Set SLACK_TOKEN in your shell (never VITE_SLACK_TOKEN). Needs channels:history and users:read; groups:history only for private channels.",
  );
const channels = (process.env.SLACK_CHANNEL_IDS || "C04NZ0MMSDV")
  .split(",")
  .map((x) => x.trim());
async function slack(method, params) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = new URL(`https://slack.com/api/${method}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.status === 429) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.max(1, Number(r.headers.get("retry-after") || 60)) * 1000,
        ),
      );
      continue;
    }
    if (!r.ok) throw Error(`Slack HTTP ${r.status}`);
    const data = await r.json();
    if (!data.ok) throw Error(`Slack ${method}: ${data.error}`);
    return data;
  }
  throw Error(
    "Slack rate limit: retry later. Existing directory is unchanged.",
  );
}
const messages = [];
const names = new Map();
for (const channel of channels) {
  let cursor = "";
  do {
    const page = await slack("conversations.history", {
      channel,
      limit: "100",
      cursor,
    });
    messages.push(
      ...page.messages
        .filter((m) => !m.subtype && m.user)
        .map((m) => ({ user: m.user, text: m.text, ts: m.ts, channel })),
    );
    cursor = page.response_metadata?.next_cursor || "";
  } while (cursor);
}
for (const user of new Set(messages.map((m) => m.user))) {
  const { user: profile } = await slack("users.info", { user });
  names.set(
    user,
    profile.profile.display_name || profile.real_name || profile.name,
  );
}
await mkdir("data/raw", { recursive: true });
await writeFile(
  "data/raw/slack.json",
  JSON.stringify(
    messages.map((m) => ({ ...m, name: names.get(m.user) })),
    null,
    2,
  ),
);
const result = spawnSync(
  process.execPath,
  ["scripts/import-slack.mjs", "data/raw/slack.json"],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
