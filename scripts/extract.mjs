// Deterministic, auditable extraction: unknown facts remain unknown.
export const taxonomy = {
  Research: {
    "Mechanistic interpretability":
      /interpretability|mech[ -]?interp|mechint\b/i,
    "AI governance": /governance|AI policy|tech policy/i,
    "AI alignment": /alignment|misalign/i,
    "AI control": /AI control/i,
    "Multi-agent systems": /multi[ -]?agent|cooperati(?:ve|on)|AI debate/i,
    Evaluations: /evaluat|benchmark|\bevals\b/i,
    Biosecurity: /biosecurity|cyber.bio|bioterror/i,
    Cybersecurity:
      /cybersecurity|cyber security|prompt injection|information security/i,
    "Game theory": /game theor|bargaining|coordination|collusion/i,
    "AI consciousness": /consciousness|sentience/i,
    Robotics: /robot/i,
    "Economics of AI": /economic|economist/i,
    Neuroscience: /neuroscien|neurotech/i,
    "AI & society":
      /societal|social impact|human agency|human.AI|human.computer/i,
  },
  Tooling: {
    "Sparse autoencoders": /sparse autoencoder|\bSAEs?\b/i,
    Python: /\bpython\b/i,
    PyTorch: /pytorch/i,
    LLMs: /\bLLMs?\b|language models?/i,
    "Reinforcement learning": /reinforcement learning|\bRLHF\b/i,
    "Causal inference": /causal inference/i,
    "Model diffing": /model diffing/i,
    "Linear probes": /linear probes?/i,
    "Activation steering": /activation steer|steering vectors?/i,
    "Formal methods": /formal verif|constraint satisfaction|theorem prov/i,
  },
  Objectives: {
    "Career transition":
      /pivot|career transition|switch careers|transition(?:ing)? (?:in)?to/i,
    "PhD ambitions":
      /(?:pursu|apply|application|get|eventually).{0,35}PhD|PhD application/i,
    Collaboration: /collaborat|swap (?:notes|skills)|brainstorm/i,
    "Meet in person": /in.person|meet up|meetup|coffee chat|cowork/i,
  },
  Interests: {
    Running: /\brunning\b|\brun as a hobby/i,
    Music: /music|guitar|piano|jazz/i,
    "Reading & writing": /reading|writing sci.fi|science fiction/i,
    "Board games": /board games|\bchess\b/i,
    Photography: /photograph/i,
    Hiking: /hiking/i,
    Film: /\bfilm\b|cinema/i,
    Physics: /physics|physicist|quantum/i,
    Mathematics: /mathemat|\bmaths?\b/i,
  },
};
// City centroids only. No geocoding of employers, origins, or travel plans.
const places = [
  ["Dublin, Georgia", 32.54, -82.9, "Dublin,? GA"],
  ["Ann Arbor", 42.2808, -83.743, "Ann Arbor"],
  ["Madison", 43.0731, -89.4012, "Madison,? (?:WI|Wisconsin)"],
  ["Cincinnati", 39.1031, -84.512, "Cincinnati"],
  ["Belfast", 54.5973, -5.9301, "(?:Near )?Belfast"],
  ["Baltimore", 39.2904, -76.6122, "Baltimore"],
  ["Bielefeld", 52.0302, 8.5325, "Bielefeld"],
  ["Santa Cruz", 36.9741, -122.0308, "Santa Cruz"],
  ["Tübingen", 48.5216, 9.0576, "T[uü]bingen"],
  ["Metro Manila", 14.5995, 120.9842, "Metro Manila"],
  ["Mannheim", 49.4875, 8.466, "Mannheim"],
  ["Urbana-Champaign", 40.1106, -88.2073, "Urbana-Champaign"],
  ["San Diego", 32.7157, -117.1611, "San Diego"],
  ["Athens, Georgia", 33.9519, -83.3576, "Athens,? (?:GA|Georgia)"],
  ["Lowell", 42.6334, -71.3162, "Lowell,? (?:MA|Massachusetts)"],
  ["Hong Kong", 22.3193, 114.1694, "Hong Kong"],
  ["Bern", 46.948, 7.4474, "Bern"],
  ["Milan", 45.4642, 9.19, "Milan"],
  ["Dhanbad", 23.7957, 86.4304, "Dhanbad"],
  ["Saarbrücken", 49.2402, 6.9969, "Saarbr[uü]cken"],
  ["Columbus", 39.9612, -82.9988, "Columbus,? (?:OH|Ohio)"],
  ["Nashville", 36.1627, -86.7816, "Nashville"],
  ["Cape Town", -33.9249, 18.4241, "Cape Town"],
  [
    "Cambridge, UK",
    52.205,
    0.119,
    "Cambridge\\s*\\(?UK\\)?|Cambridge,? (?:England|United Kingdom)",
  ],
  [
    "Cambridge, Massachusetts",
    42.373,
    -71.11,
    "Cambridge,? (?:MA|Massachusetts)",
  ],
  [
    "San Francisco Bay Area",
    37.7749,
    -122.4194,
    "Berkeley/SF|SF/Bay Area|Bay Area",
  ],
  ["Berkeley", 37.872, -122.273, "Berkeley"],
  ["San Francisco", 37.775, -122.419, "San Francisco|SF"],
  ["New York", 40.713, -74.006, "New York(?: City)?|NYC"],
  ["Boston", 42.36, -71.059, "Boston"],
  ["Chicago", 41.878, -87.63, "Chicago"],
  ["Berlin", 52.52, 13.405, "Berlin"],
  ["Munich", 48.137, 11.575, "Munich"],
  ["Warsaw", 52.23, 21.012, "Warsaw"],
  ["London", 51.507, -0.128, "London"],
  ["Paris", 48.857, 2.352, "Paris"],
  ["Zurich", 47.377, 8.542, "Z[uü]rich"],
  ["Vienna", 48.208, 16.374, "Vienna"],
  ["Toronto / Waterloo", 43.65, -79.38, "Toronto/Waterloo"],
  ["Toronto", 43.653, -79.383, "Toronto"],
  ["Waterloo", 43.464, -80.521, "Waterloo"],
  ["New Haven", 41.308, -72.928, "New Haven"],
  ["Sydney", -33.869, 151.209, "Sydney"],
  ["Lenoir", 35.914, -81.54, "Lenoir"],
  ["Cairo", 30.044, 31.236, "Cairo"],
  ["Buenos Aires", -34.604, -58.382, "Buenos Aires"],
  ["Washington, DC", 38.907, -77.037, "Washington,? DC|DC"],
  ["Atlanta", 33.749, -84.388, "Atlanta"],
  ["Rio de Janeiro", -22.907, -43.173, "Rio de Janeiro"],
  ["Moscow", 55.756, 37.617, "Moscow"],
  ["Bangkok", 13.756, 100.502, "Bangkok"],
  ["Ottawa", 45.421, -75.697, "Ottawa"],
  ["Montreal", 45.502, -73.567, "Montr[eé]al"],
  ["Singapore", 1.352, 103.82, "Singapore"],
  ["Seattle", 47.606, -122.332, "Seattle"],
  ["Barcelona", 41.387, 2.168, "Barcelona"],
  ["Oxford", 51.752, -1.258, "Oxford"],
  ["Los Angeles", 34.052, -118.244, "Los Angeles"],
  ["Austin", 30.267, -97.743, "Austin"],
  ["Pittsburgh", 40.441, -79.996, "Pittsburgh"],
  ["Rochester", 43.157, -77.608, "Rochester"],
  ["Delft", 52.011, 4.358, "Delft"],
  ["Amsterdam", 52.367, 4.904, "Amsterdam"],
  ["Dublin", 53.35, -6.26, "Dublin(?!,? GA)"],
  ["Bengaluru", 12.972, 77.595, "Bangalore|Bengaluru"],
  ["Delhi", 28.614, 77.209, "New Delhi|Delhi"],
  ["Mumbai", 19.076, 72.878, "Mumbai"],
  ["Melbourne", -37.814, 144.963, "Melbourne"],
  ["Edinburgh", 55.953, -3.188, "Edinburgh"],
  ["Stockholm", 59.329, 18.069, "Stockholm"],
  ["Prague", 50.075, 14.438, "Prague"],
  ["Tel Aviv", 32.085, 34.782, "Tel Aviv"],
  ["Jerusalem", 31.768, 35.214, "Jerusalem"],
];
export function clean(text) {
  return text
    .replace(/<mailto:[^>]+>/g, "")
    .replace(/<https?:\/\/[^|>]+\|([^>]+)>/g, "$1")
    .replace(/<(https?:\/\/[^>]+)>/g, "$1")
    .replace(/<@[A-Z0-9]+(?:\|([^>]+))?>/g, (_, n) => n || "a colleague")
    .replace(/:[a-z0-9_+-]+:/g, "")
    .replace(/[*_~]/g, "")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}
export function locationFrom(text) {
  const candidates = [];
  for (const [city, lat, lng, alias] of places) {
    const re = new RegExp(
      "(?:\\b(?:based(?: out of)?|living|live|located|residing)\\s+(?:in\\s+(?:the\\s+)?)?|\\bI[’\x27]m in\\s+|\\bI am in\\s+)(" +
        alias +
        ")(?=[\\s,.;/)!]|$)",
      "gi",
    );
    for (const m of text.matchAll(re)) {
      const prefix = text.slice(Math.max(0, m.index - 55), m.index);
      if (
        /(?:if you(?:[’']re| are)?|anyone(?: else)?(?: also)?|people(?: also)?|previously|used to|was|hope to)\s*$/i.test(
          prefix,
        )
      )
        continue;
      candidates.push({ city, lat, lng, evidence: m[0], index: m.index });
    }
  }
  return candidates.sort((a, b) => a.index - b.index)[0] ?? null;
}
export function rolesFrom(text) {
  const roles = [];
  if (
    /\bI(?:[’']m| am|[’']ll be| will be) (?:a |co-)?mentor(?:ing| for| on|\b(?!ed))|\b(?:I[’']m|I am|I[’']ll be|I will be|will be) mentoring|my first time mentoring|projects?\(?s?\)? I[’']m mentoring|my mentees|(?:I[’']ll be|I will be|will be|will) supervis(?:ing|e) a project|\bSupervising a project|I[’']m the supervisor/i.test(
      text,
    )
  )
    roles.push("mentor");
  if (
    /\bI(?:[’']m| am) (?:a )?mentee|\bI(?:[’']ll| will) be mentored by/i.test(
      text,
    )
  )
    roles.push("mentee");
  if (
    !roles.includes("mentor") &&
    /(?:I.{0,100}(?:work|join)|my SPAR project)[^.]*?(?:mentored|supervised) by|I(?:[’']ll| will) be supervised by/is.test(
      text,
    )
  )
    roles.push("mentee");
  return roles.length ? [...new Set(roles)] : ["unknown"];
}
export function extract(messages, overrides = {}) {
  const people = new Map();
  for (const m of [...messages].sort((a, b) => Number(b.ts) - Number(a.ts))) {
    if (
      !m.user ||
      people.has(m.user) ||
      !m.text?.trim() ||
      m.subtype === "channel_join"
    )
      continue;
    const intro = clean(m.text);
    if (intro.length < 100) continue;
    const tags = Object.entries(taxonomy).flatMap(([category, items]) =>
      Object.entries(items)
        .filter(([, r]) => r.test(intro))
        .map(([label]) => ({ category, label })),
    );
    const location = locationFrom(intro);
    const p = {
      id: m.user,
      name: m.name || m.user,
      roles: rolesFrom(intro),
      location: location
        ? {
            city: location.city,
            lat: location.lat,
            lng: location.lng,
            evidence: location.evidence,
          }
        : null,
      intro,
      tags: [...new Map(tags.map((t) => [t.label, t])).values()],
      date: new Date(Number(m.ts) * 1000).toISOString().slice(0, 10),
      sourceUrl: `https://spar2025.slack.com/archives/${m.channel || "C04NZ0MMSDV"}/p${m.ts.replace(".", "")}`,
      slackUrl: `https://spar2025.slack.com/team/${m.user}`,
      ...overrides[m.user],
    };
    people.set(m.user, p);
  }
  return [...people.values()];
}
export function parseConnector(text) {
  return [
    ...text.matchAll(
      /=== Message from (.*?) <[^>]*> \((U[A-Z0-9]+)\) at .*? ===\s*\nMessage TS: ([\d.]+)\n([\s\S]*?)(?=\n=== Message from |$)/g,
    ),
  ].map(([, name, user, ts, body]) => ({
    name,
    user,
    ts,
    text: body.replace(/\n(?:Reactions:|Thread:|Channel:)[^\n]*/g, "").trim(),
  }));
}

export function universe2025(messages) {
  return messages.filter(
    (m) =>
      Number(m.ts) >= Date.UTC(2025, 0, 1) / 1000 &&
      Number(m.ts) < Date.UTC(2026, 0, 1) / 1000,
  );
}
