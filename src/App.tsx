import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
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
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconArrowUpRight,
  IconBrandLinkedin,
  IconBrandSlack,
  IconCheck,
  IconCompass,
  IconExternalLink,
  IconFilter,
  IconFocusCentered,
  IconMapPin,
  IconSearch,
  IconUsers,
  IconWorld,
  IconX,
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
    q: params.get("q") || "",
    roles: params.has("roles")
      ? params
          .get("roles")!
          .split(",")
          .filter((role) => role === "mentor" || role === "mentee")
      : ["mentor", "mentee"],
    tags: params.getAll("tag"),
    mode: params.get("match") === "all" ? "all" : "any",
    location: params.get("location") || "all",
  };
}

export default function App() {
  const [initial] = useState(initialState);
  const [q, setQ] = useState(initial.q);
  const [roles, setRoles] = useState(initial.roles);
  const [tags, setTags] = useState(initial.tags);
  const [mode, setMode] = useState(initial.mode);
  const [selected, setSelected] = useState<Person | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [reset, setReset] = useState(0);
  const [view, setView] = useState("map");
  const [copied, setCopied] = useState(false);
  const [locationFilter, setLocationFilter] = useState(initial.location);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (roles.length !== 2) params.set("roles", roles.join(","));
    tags.forEach((tag) => params.append("tag", tag));
    if (mode === "all") params.set("match", "all");
    if (locationFilter !== "all") params.set("location", locationFilter);
    history.replaceState(
      null,
      "",
      `${location.pathname}${params.size ? `?${params}` : ""}`,
    );
  }, [q, roles, tags, mode, locationFilter]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return people.filter((person) => {
      const searchable = [
        person.name,
        person.intro,
        person.location?.city,
        person.locationText,
        person.project,
        ...(person.backgroundResearchInterests || []),
        ...(person.specificMeans || []),
        ...(person.specificEnds || []),
        ...(person.interests || []),
        ...person.tags.map((tag) => tag.label),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const personTagKeys = new Set(
        person.tags.map((tag) => tagKey(tag.category, tag.label)),
      );
      const tagMatch =
        !tags.length ||
        (mode === "all"
          ? tags.every((tag) => personTagKeys.has(tag))
          : tags.some((tag) => personTagKeys.has(tag)));
      return (
        roles.some((role) => person.roles.includes(role)) &&
        (locationFilter === "all" ||
          (locationFilter === "mapped" ? !!person.location : !person.location)) &&
        (!needle || searchable.includes(needle)) &&
        tagMatch
      );
    });
  }, [roles, locationFilter, q, tags, mode]);

  const tagData = useMemo(() => {
    const counts = new Map<string, { category: string; label: string; count: number }>();
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
    setQ("");
    setRoles(["mentor", "mentee"]);
    setTags([]);
    setMode("any");
    setLocationFilter("all");
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
      <Select
        label="Location"
        data={[
          { value: "all", label: "Everyone" },
          { value: "mapped", label: "On the map" },
          { value: "unmapped", label: "Location not stated" },
        ]}
        value={locationFilter}
        onChange={(value) => setLocationFilter(value || "all")}
      />
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
        <Group gap="xs">
          <Button
            variant="subtle"
            color="gray"
            leftSection={copied ? <IconCheck size={17} /> : <IconArrowUpRight size={17} />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Share view"}
          </Button>
          <Button component="a" href="https://spar2025.slack.com" target="_blank" rel="noreferrer" variant="default" leftSection={<IconBrandSlack size={17} />}>Open Slack</Button>
        </Group>
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
            <TextInput
              className="person-search"
              aria-label="Search people"
              placeholder="Search people, projects, methods, goals…"
              leftSection={<IconSearch size={18} />}
              value={q}
              onChange={(event) => setQ(event.currentTarget.value)}
              rightSection={q ? <ActionIcon aria-label="Clear search" variant="subtle" onClick={() => setQ("")}><IconX size={14} /></ActionIcon> : null}
            />
            <Button className="mobile-filter-button" variant="default" leftSection={<IconFilter size={16} />} onClick={() => setMobileFilters(true)}>Filters</Button>
            <SegmentedControl
              value={view}
              onChange={setView}
              data={[
                { value: "map", label: <Group gap={6}><IconWorld size={15} />Map</Group> },
                { value: "list", label: <Group gap={6}><IconUsers size={15} />Directory</Group> },
              ]}
            />
          </div>

          <Group className="results-heading" justify="space-between">
            <Text size="sm"><b>{filtered.length} people</b> <span className="muted">with something in common</span></Text>
            <Text size="xs" c="dimmed">{mapped.length} on the map · {cities.size} cities</Text>
          </Group>

          {view === "map" ? (
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
          ) : (
            <div className="directory">
              {filtered.map(card)}
              {!filtered.length && <div className="empty"><Text fw={700}>No matches yet</Text><Text size="sm" c="dimmed">Try clearing a filter or broadening the search.</Text></div>}
            </div>
          )}
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
