import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Group,
  Loader,
  MultiSelect,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowUpRight,
  IconBrandLinkedin,
  IconBrandSlack,
  IconCompass,
  IconExternalLink,
  IconFilter,
  IconFocusCentered,
  IconMapPin,
  IconSearch,
} from "@tabler/icons-react";
import { dataset } from "./directory";
import type { Person } from "./types";

const PeopleMap = lazy(() => import("./PeopleMap"));
const people = dataset.people;
const roleLabels = { mentor: "Mentors", mentee: "Mentees" } as const;
const TAG_CATEGORIES = [
  "Methods & approaches",
  "Research goals",
  "Outside research",
] as const;
const tagKey = (category: string, label: string) => `${category}::${label}`;
const roleColor = (person: Person) =>
  person.roles.includes("mentor") ? "violet" : "teal";
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

function initialState() {
  const params = new URLSearchParams(location.search);
  return {
    roles: params.has("roles")
      ? params
          .get("roles")!
          .split(",")
          .filter((role) => role === "mentor" || role === "mentee")
      : ["mentor", "mentee"],
    tags: params.getAll("tag"),
    mode: params.get("match") === "all" ? "all" : "any",
  };
}

export default function App() {
  const [initial] = useState(initialState);
  const [roles, setRoles] = useState(initial.roles);
  const [tags, setTags] = useState(initial.tags);
  const [mode, setMode] = useState(initial.mode);
  const [selected, setSelected] = useState<Person | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [reset, setReset] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (roles.length !== 2) params.set("roles", roles.join(","));
    tags.forEach((tag) => params.append("tag", tag));
    if (mode === "all") params.set("match", "all");
    history.replaceState(
      null,
      "",
      `${location.pathname}${params.size ? `?${params}` : ""}`,
    );
  }, [roles, tags, mode]);

  const filtered = useMemo(() => {
    return people.filter((person) => {
      const personTagKeys = new Set(
        person.tags.map((tag) => tagKey(tag.category, tag.label)),
      );
      const tagMatch =
        !tags.length ||
        (mode === "all"
          ? tags.every((tag) => personTagKeys.has(tag))
          : tags.some((tag) => personTagKeys.has(tag)));
      return roles.some((role) => person.roles.includes(role)) && tagMatch;
    });
  }, [roles, tags, mode]);

  const tagData = useMemo(() => {
    const counts = new Map<
      string,
      { category: string; label: string; count: number }
    >();
    people.forEach((person) =>
      person.tags.forEach((tag) => {
        const key = tagKey(tag.category, tag.label);
        counts.set(key, {
          ...tag,
          count: (counts.get(key)?.count || 0) + 1,
        });
      }),
    );

    return TAG_CATEGORIES.map((category) => ({
      group: category,
      items: [...counts.values()]
        .filter((tag) => tag.category === category)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
        .map((tag) => ({
          value: tagKey(tag.category, tag.label),
          label: tag.label,
        })),
    })).filter((group) => group.items.length);
  }, []);

  const mapped = filtered.filter((person) => person.location);
  const cities = new Set(mapped.map((person) => person.location!.city));
  const clear = () => {
    setRoles(["mentor", "mentee"]);
    setTags([]);
    setMode("any");
    setSelected(null);
  };

  const filters = (
    <>
      <Group justify="space-between" mb="lg">
        <Text fw={700} size="lg">Find your people</Text>
        <Button variant="subtle" size="compact-xs" onClick={clear}>Reset</Button>
      </Group>
      <Text className="eyebrow" mb="sm">COMMUNITY ROLE</Text>
      <Checkbox.Group value={roles} onChange={setRoles}>
        <Stack gap="sm">
          {Object.entries(roleLabels).map(([value, label]) => (
            <Group key={value} justify="space-between">
              <Checkbox
                value={value}
                label={label}
                color={value === "mentor" ? "violet" : "teal"}
              />
              <Text size="xs" c="dimmed">
                {people.filter((person) => person.roles.includes(value)).length}
              </Text>
            </Group>
          ))}
        </Stack>
      </Checkbox.Group>
      <Divider my="xl" />
      <Group justify="space-between" mb="sm">
        <Text className="eyebrow">COMMON GROUND</Text>
        {!!tags.length && <Badge color="teal" size="sm">{tags.length}</Badge>}
      </Group>
      <MultiSelect
        searchable
        clearable
        hidePickedOptions
        data={tagData}
        value={tags}
        onChange={setTags}
        placeholder="Search methods, goals, hobbies…"
        leftSection={<IconSearch size={16} />}
        maxDropdownHeight={330}
        nothingFoundMessage="No matching tags"
        comboboxProps={{ transitionProps: { duration: 150, transition: "fade" } }}
      />
      <Group justify="space-between" mt="md">
        <Text size="xs" c="dimmed">Match selected tags</Text>
        <SegmentedControl
          size="xs"
          value={mode}
          onChange={setMode}
          data={[{ label: "Any", value: "any" }, { label: "All", value: "all" }]}
        />
      </Group>
    </>
  );

  const card = (person: Person) => (
    <button
      className={`person-card ${selected?.id === person.id ? "active" : ""}`}
      key={person.id}
      onClick={() => setSelected(person)}
    >
      <Group wrap="nowrap" align="flex-start">
        <Avatar color={roleColor(person)} radius="xl" size={42}>{initials(person.name)}</Avatar>
        <div className="person-summary">
          <Group gap="xs" justify="space-between">
            <Text fw={650} size="sm">{person.name}</Text>
            <IconArrowUpRight size={15} color="#8b94a2" />
          </Group>
          <Text size="xs" c="dimmed" mt={3}>
            <IconMapPin size={12} /> {person.location?.city || person.locationText || "Location not stated"}
          </Text>
        </div>
      </Group>
      <Text size="sm" lineClamp={2} mt="sm" c="#647084">{person.intro}</Text>
      <Group gap={5} mt="sm">
        <Badge color={roleColor(person)} variant="light" size="xs">{person.roles.join(" + ")}</Badge>
        {person.tags.slice(0, 2).map((tag) => (
          <Badge key={`${tag.category}:${tag.label}`} variant="outline" color="gray" size="xs">{tag.label}</Badge>
        ))}
      </Group>
    </button>
  );

  return (
    <div className="app">
      <header className="header">
        <Group gap="sm">
          <div className="brand-symbol"><IconCompass size={27} /></div>
          <Text fw={850} size="xl" lts={-1}>
            SPAR<span className="brand-divider">/</span><span className="brand-subtitle">common ground</span>
          </Text>
          <Badge variant="light" color="gray" className="community-badge">Community atlas</Badge>
        </Group>
        <Button component="a" href="https://spar2025.slack.com" target="_blank" rel="noreferrer" variant="default" leftSection={<IconBrandSlack size={17} />}>Open Slack</Button>
      </header>

      <section className="intro">
        <div>
          <Text className="eyebrow" c="teal" mb={9}>A LITTLE CLOSER TO YOUR NEXT COLLABORATOR</Text>
          <Title order={1}>Big ideas. <span>Common ground.</span></Title>
          <Text c="dimmed" mt="sm">Find a shared research thread, a nearby collaborator, or something to talk about outside work.</Text>
        </div>
        <Group gap={32} className="stats">
          <div><Text className="stat-number">{people.length}</Text><Text size="xs" c="dimmed">community members</Text></div>
          <div><Text className="stat-number">{new Set(people.flatMap((person) => person.location ? [person.location.city] : [])).size}</Text><Text size="xs" c="dimmed">cities connected</Text></div>
        </Group>
      </section>

      <div className="workspace">
        <aside className="filters">{filters}</aside>
        <main className="main">
          <div className="toolbar">
            <Button className="mobile-filter-button" variant="default" leftSection={<IconFilter size={16} />} onClick={() => setMobileFilters(true)}>Filters</Button>
          </div>

          <Group className="results-heading" justify="space-between">
            <Text size="sm"><b>{filtered.length} people</b> <span className="muted">with something in common</span></Text>
            <Text size="xs" c="dimmed">{mapped.length} on the map · {cities.size} cities</Text>
          </Group>

          <div className="map-layout">
            <section className="map-panel" aria-label="Community map">
              <Suspense fallback={<div className="loading"><Loader /></div>}>
                <PeopleMap people={filtered} focus={selected} onSelect={setSelected} reset={reset} />
              </Suspense>
              <Button className="fit-map" size="xs" variant="white" color="dark" leftSection={<IconFocusCentered size={16} />} onClick={() => { setSelected(null); setReset((value) => value + 1); }}>Fit everyone</Button>
            </section>
            <section className="people-panel">
              <Group justify="space-between" p="md"><Text fw={700} size="sm">Meet the community</Text><Badge variant="light" color="gray">{filtered.length}</Badge></Group>
              <ScrollArea className="people-scroll">{filtered.map(card)}</ScrollArea>
            </section>
          </div>

          <footer><Text size="xs" c="dimmed">City-level participant locations · browser location stays in your browser</Text><Text size="xs" c="dimmed">Fall 2026 introductions</Text></footer>
        </main>
      </div>

      <Drawer opened={mobileFilters} onClose={() => setMobileFilters(false)} title="Find your people" padding="md">{filters}</Drawer>
      <Drawer opened={!!selected} onClose={() => setSelected(null)} position="right" size="md" title={selected?.name}>
        {selected && (
          <Stack>
            <Group>
              <Avatar color={roleColor(selected)} size="lg" radius="xl">{initials(selected.name)}</Avatar>
              <div>
                <Badge color={roleColor(selected)} variant="light">{selected.roles.join(" + ")}</Badge>
                <Text size="sm" c="dimmed" mt={5}>{selected.location?.city || selected.locationText || "Location not stated"}</Text>
              </div>
            </Group>
            {selected.project && <div><Text size="xs" fw={700} c="dimmed" mb={4}>SPAR PROJECT</Text>{selected.projectUrl ? <Button component="a" href={selected.projectUrl} target="_blank" rel="noreferrer" variant="subtle" size="compact-sm" px={0} rightSection={<IconArrowUpRight size={14} />}>{selected.project}</Button> : <Text size="sm">{selected.project}</Text>}</div>}
            <Divider />
            <Text size="sm" className="intro-copy">{selected.intro}</Text>
            {!!selected.tags.length && <Group gap={6}>{selected.tags.map((tag) => <Badge key={`${tag.category}:${tag.label}`} variant="light" color="gray">{tag.label}</Badge>)}</Group>}
            {!!selected.backgroundResearchInterests?.length && <div><Text size="xs" fw={700} c="dimmed" mb={6}>BACKGROUND RESEARCH</Text><Text size="sm">{selected.backgroundResearchInterests.join(" · ")}</Text></div>}
            <Divider />
            <Group>
              {selected.slackUrl && <Button component="a" href={selected.slackUrl} target="_blank" rel="noreferrer" leftSection={<IconBrandSlack size={16} />}>Message on Slack</Button>}
              {selected.sourceUrl && <Button component="a" href={selected.sourceUrl} target="_blank" rel="noreferrer" variant="default" rightSection={<IconArrowUpRight size={14} />}>Introduction</Button>}
              {selected.socialMedia?.linkedin && <Button component="a" href={selected.socialMedia.linkedin} target="_blank" rel="noreferrer" variant="default" leftSection={<IconBrandLinkedin size={15} />}>LinkedIn</Button>}
              {selected.websites?.[0] && <Button component="a" href={selected.websites[0]} target="_blank" rel="noreferrer" variant="subtle" leftSection={<IconExternalLink size={15} />}>Website</Button>}
            </Group>
          </Stack>
        )}
      </Drawer>
    </div>
  );
}
