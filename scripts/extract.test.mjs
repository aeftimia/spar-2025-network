import test from "node:test";
import assert from "node:assert/strict";
import {
  extract,
  locationFrom,
  rolesFrom,
  parseConnector,
} from "./extract.mjs";
test("uses present city rather than origin, university or upcoming travel", () => {
  assert.equal(
    locationFrom(
      "I'm originally from London, currently based in Berlin, but will be in Paris soon.",
    ).city,
    "Berlin",
  );
  assert.equal(
    locationFrom(
      "I'm studying at Berkeley. If you're based in London, reach out.",
    ),
    null,
  );
  assert.equal(
    locationFrom("I'm based in Dublin, GA, US.").city,
    "Dublin, Georgia",
  );
});
test("does not treat a named mentor or previous mentee role as current role", () => {
  assert.deepEqual(rolesFrom("I will be working with my mentor John."), [
    "unknown",
  ]);
  assert.deepEqual(rolesFrom("Previously I was a mentee in SOAR."), [
    "unknown",
  ]);
  assert.deepEqual(rolesFrom("I'm mentoring three projects."), ["mentor"]);
  assert.deepEqual(rolesFrom("I'm a mentee working on evaluations."), [
    "mentee",
  ]);
});
test("newest introduction wins, tags and sources preserved, emails stripped", () => {
  const people = extract([
    {
      user: "U123",
      name: "Name",
      ts: "1700000000.000001",
      text: "I'm a mentee based in Berlin working on mechanistic interpretability with PyTorch. Please email name@example.com. I like running.",
    },
    {
      user: "U123",
      name: "Name",
      ts: "1600000000.000001",
      text: "Old ".repeat(40),
    },
  ]);
  assert.equal(people.length, 1);
  assert.equal(people[0].location.city, "Berlin");
  assert(people[0].tags.some((t) => t.label === "PyTorch"));
  assert(!people[0].intro.includes("name@example.com"));
  assert(people[0].sourceUrl.endsWith("p1700000000000001"));
});
test("connector transcript parsing strips reactions", () => {
  const result = parseConnector(
    "=== Message from Name <private@example.com> (U123) at 2026-09-13 EDT === \nMessage TS: 1700000000.000001\nHello there\nReactions: wave (2)",
  );
  assert.equal(result[0].text, "Hello there");
  assert.equal(result[0].name, "Name");
});
test("current location survives nearby mention of other people", () => {
  assert.equal(
    locationFrom(
      "Happy to meet people in person (currently based in Berkeley/SF).",
    ).city,
    "San Francisco Bay Area",
  );
  assert.equal(
    locationFrom("I'm currently located in the Toronto/Waterloo area.").city,
    "Toronto / Waterloo",
  );
});
test("project aliases resolve to the same project tag", () => {
  const messages = [
    {
      user: "U1",
      name: "One",
      ts: "1700000000.000001",
      text:
        "Hi I am working on <https://sparai.org/projects/f26/abc/|Moral Shadowbanning>. " +
        "Research ".repeat(15),
    },
    {
      user: "U2",
      name: "Two",
      ts: "1700000001.000001",
      text:
        "I am working on <https://sparai.org/projects/f26/abc/?search=a|moral shadowbanning by language models>. " +
        "Research ".repeat(15),
    },
  ];
  const p = extract(messages);
  assert.deepEqual(
    p[0].tags.filter((t) => t.category === "Projects"),
    p[1].tags.filter((t) => t.category === "Projects"),
  );
});
