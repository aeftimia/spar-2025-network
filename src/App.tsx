import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Group,
  Loader,
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
  IconBrandSlack,
  IconCheck,
  IconCompass,
  IconFilter,
  IconMapPin,
  IconSearch,
  IconUsers,
  IconX,
  IconWorld,
  IconFocusCentered,
} from "@tabler/icons-react";
import type { Dataset, Person } from "./types";
const PeopleMap = lazy(() => import("./PeopleMap"));
const roleLabels: Record<string, string> = {
  mentor: "Mentors",
  mentee: "Mentees",
};
const roleColor = (p: Person) =>
  p.roles.includes("mentor") ? "violet" : "teal";
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
const getInitial = () => {
  const p = new URLSearchParams(location.search);
  return {
    q: p.get("q") || "",
    roles: p.has("roles")
      ? p
          .get("roles")!
          .split(",")
          .filter((role) => role === "mentor" || role === "mentee")
      : ["mentor", "mentee"],
    tags: p.getAll("tag"),
    mode: p.get("match") === "all" ? "all" : "any",
    location: p.get("location") || "all",
  };
};
export default function App() {
  const [initial] = useState(getInitial);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState(initial.q),
    [roles, setRoles] = useState(initial.roles),
    [tags, setTags] = useState(initial.tags),
    [mode, setMode] = useState(initial.mode),
    [tagSearch, setTagSearch] = useState("");
  const [selected, setSelected] = useState<Person | null>(null),
    [mobileFilters, setMobileFilters] = useState(false),
    [reset, setReset] = useState(0),
    [view, setView] = useState("map"),
    [copied, setCopied] = useState(false);
  const [locationFilter, setLocationFilter] = useState(initial.location);
  useEffect(() => {
    const c = new AbortController();
    fetch("/data/people.json", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw Error("Could not load the community directory.");
        return r.json();
      })
      .then(setDataset)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (roles.length !== 2) p.set("roles", roles.join(","));
    tags.forEach((t) => p.append("tag", t));
    if (mode === "all") p.set("match", "all");
    if (locationFilter !== "all") p.set("location", locationFilter);
    history.replaceState(
      null,
      "",
      `${location.pathname}${p.size ? "?" + p : ""}`,
    );
  }, [q, roles, tags, mode, locationFilter]);
  const people = dataset?.people || [];
  const filtered = useMemo(
    () =>
      people.filter(
        (p) =>
          roles.some((r) => p.roles.includes(r)) &&
          (locationFilter === "all" ||
            (locationFilter === "mapped" ? !!p.location : !p.location)) &&
          (!q ||
            `${p.name} ${p.intro} ${p.location?.city || ""}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (!tags.length ||
            (mode === "all"
              ? tags.every((t) => p.tags.some((x) => x.label === t))
              : tags.some((t) => p.tags.some((x) => x.label === t)))),
      ),
    [people, roles, locationFilter, q, tags, mode],
  );
  const tagGroups = useMemo(() => {
    const counts = new Map<
      string,
      { category: string; label: string; count: number }
    >();
    people.forEach((p) =>
      p.tags.forEach((t) =>
        counts.set(`${t.category}:${t.label}`, {
          ...t,
          count: (counts.get(`${t.category}:${t.label}`)?.count || 0) + 1,
        }),
      ),
    );
    return ["Methods & approaches", "Research goals", "Outside research"]
      .map((category) => ({
        category,
        items: [...counts.values()]
          .filter(
            (t) =>
              t.category === category &&
              t.label.toLowerCase().includes(tagSearch.toLowerCase()),
          )
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      }))
      .filter((g) => g.items.length);
  }, [people, tagSearch]);
  const mapped = filtered.filter((p) => p.location),
    cities = new Set(mapped.map((p) => p.location!.city));
  const toggleTag = (t: string) =>
    setTags((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));
  const clear = () => {
    setQ("");
    setRoles(["mentor", "mentee"]);
    setTags([]);
    setMode("any");
    setLocationFilter("all");
    setTagSearch("");
    setSelected(null);
  };
  const filters = (
    <>
      <Group justify="space-between" mb="lg">
        <Text fw={700} size="lg">
          Find your people
        </Text>
        <Button variant="subtle" size="compact-xs" onClick={clear}>
          Reset
        </Button>
      </Group>
      <Text className="eyebrow" mb="sm">
        COMMUNITY ROLE
      </Text>
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
                {people.filter((p) => p.roles.includes(value)).length}
              </Text>
            </Group>
          ))}
        </Stack>
      </Checkbox.Group>
      <Divider my="xl" />
      <Select
        mt="md"
        label="Location"
        data={[
          { value: "all", label: "Everyone" },
          { value: "mapped", label: "On the map" },
          { value: "unmapped", label: "Location not stated" },
        ]}
        value={locationFilter}
        onChange={(v) => setLocationFilter(v || "all")}
      />
      <Divider my="xl" />
      <Group justify="space-between" mb="sm">
        <Text className="eyebrow">COMMON GROUND</Text>
        {tags.length > 0 && (
          <Badge color="teal" size="sm">
            {tags.length}
          </Badge>
        )}
      </Group>
      <TextInput
        aria-label="Search tags"
        placeholder="Search methods, goals, hobbies…"
        leftSection={<IconSearch size={16} />}
        value={tagSearch}
        onChange={(e) => setTagSearch(e.currentTarget.value)}
      />
      <Group justify="space-between" my="md">
        <Text size="xs" c="dimmed">
          Match selected tags
        </Text>
        <SegmentedControl
          size="xs"
          value={mode}
          onChange={setMode}
          data={[
            { label: "Any", value: "any" },
            { label: "All", value: "all" },
          ]}
        />
      </Group>
      <div className="tag-options">
        {tagGroups.map((g) => (
          <div key={g.category} className="tag-group">
            <Text size="xs" fw={700} c="dimmed" mb="sm">
              {g.category.toUpperCase()}
            </Text>
            <Stack gap="sm">
              {g.items.map((t) => (
                <Group
                  key={`${g.category}:${t.label}`}
                  wrap="nowrap"
                  justify="space-between"
                  align="flex-start"
                >
                  <Checkbox
                    label={t.label}
                    checked={tags.includes(t.label)}
                    onChange={() => toggleTag(t.label)}
                    size="xs"
                  />
                  <Text size="xs" c="dimmed">
                    {t.count}
                  </Text>
                </Group>
              ))}
            </Stack>
          </div>
        ))}
        {!tagGroups.length && (
          <Text c="dimmed" size="sm">
            No tags found. Try another term.
          </Text>
        )}
      </div>
    </>
  );
  const card = (p: Person) => (
    <button
      className={`person-card ${selected?.id === p.id ? "active" : ""}`}
      key={p.id}
      onClick={() => setSelected(p)}
    >
      <Group wrap="nowrap" align="flex-start">
        <Avatar color={roleColor(p)} radius="xl" size={42}>
          {initials(p.name)}
        </Avatar>
        <div className="person-summary">
          <Group gap="xs" justify="space-between">
            <Text fw={650} size="sm">
              {p.name}
            </Text>
            <IconArrowUpRight size={15} color="#8b94a2" />
          </Group>
          <Text size="xs" c="dimmed" mt={3}>
            <IconMapPin size={12} />{" "}
            {p.location
              ? p.location.city + (p.location.inferred ? " · inferred" : "")
              : "Location not stated"}
          </Text>
        </div>
      </Group>
      <Text size="sm" lineClamp={2} mt="sm" c="#647084">
        {p.intro}
      </Text>
      <Group gap={5} mt="sm">
        <Badge color={roleColor(p)} variant="light" size="xs">
          {p.roles.join(" + ")}
        </Badge>
        {p.tags.slice(0, 2).map((t) => (
          <Badge key={`${t.category}:${t.label}`} variant="outline" color="gray" size="xs">
            {t.label}
          </Badge>
        ))}
      </Group>
    </button>
  );
  if (error)
    return (
      <div className="loading">
        <Alert color="red" title="Directory unavailable">
          {error}
          <Button mt="md" onClick={() => location.reload()}>
            Try again
          </Button>
        </Alert>
      </div>
    );
  if (!dataset)
    return (
      <div className="loading">
        <Loader />
        <Text>Finding common ground…</Text>
      </div>
    );
  return (
    <div className="app">
      <header className="header">
        <Group gap="sm">
          <div className="brand-symbol">
            <IconCompass size={27} />
          </div>
          <Text fw={850} size="xl" lts={-1}>
            SPAR<span className="brand-divider">/</span>
            <span className="brand-subtitle">common ground</span>
          </Text>
          <Badge variant="light" color="gray" className="community-badge">
            Community atlas
          </Badge>
        </Group>
        <Group gap="xs">
          <Button
            variant="subtle"
            color="gray"
            leftSection={
              copied ? <IconCheck size={17} /> : <IconArrowUpRight size={17} />
            }
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
          <Button
            component="a"
            href="https://spar2025.slack.com"
            target="_blank"
            rel="noreferrer"
            variant="default"
            leftSection={<IconBrandSlack size={17} />}
          >
            Open Slack
          </Button>
        </Group>
      </header>
      <section className="intro">
        <div>
          <Text className="eyebrow" c="teal" mb={9}>
            A LITTLE CLOSER TO YOUR NEXT COLLABORATOR
          </Text>
          <Title order={1}>
            Big ideas. <span>Common ground.</span>
          </Title>
          <Text c="dimmed" mt="sm">
            Find a shared interest. Meet someone nearby. Start a conversation.
          </Text>
        </div>
        <Group gap={32} className="stats">
          <div>
            <Text className="stat-number">{people.length}</Text>
            <Text size="xs" c="dimmed">
              community members
            </Text>
          </div>
          <div>
            <Text className="stat-number">
              {
                new Set(
                  people.flatMap((p) => (p.location ? [p.location.city] : [])),
                ).size
              }
            </Text>
            <Text size="xs" c="dimmed">
              cities connected
            </Text>
          </div>
        </Group>
      </section>
      <div className="workspace">
        <aside className="filters">{filters}</aside>
        <main className="main">
          <div className="toolbar">
            <TextInput
              className="person-search"
              aria-label="Search people"
              placeholder="Search people, places, and interests"
              leftSection={<IconSearch size={18} />}
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              rightSection={
                q ? (
                  <ActionIcon
                    aria-label="Clear search"
                    variant="subtle"
                    onClick={() => setQ("")}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                ) : null
              }
            />
            <Button
              className="mobile-filter-button"
              variant="default"
              leftSection={<IconFilter size={16} />}
              onClick={() => setMobileFilters(true)}
            >
              Filters
            </Button>
            <SegmentedControl
              value={view}
              onChange={setView}
              data={[
                {
                  value: "map",
                  label: (
                    <Group gap={6}>
                      <IconWorld size={15} />
                      Map
                    </Group>
                  ),
                },
                {
                  value: "list",
                  label: (
                    <Group gap={6}>
                      <IconUsers size={15} />
                      Directory
                    </Group>
                  ),
                },
              ]}
            />
          </div>
          {tags.length > 0 && (
            <Group gap={6} className="selected-tags">
              {tags.map((t) => (
                <Button
                  key={t}
                  variant="light"
                  size="compact-xs"
                  rightSection={<IconX size={12} />}
                  onClick={() => toggleTag(t)}
                >
                  {t}
                </Button>
              ))}
              <Button
                variant="subtle"
                size="compact-xs"
                color="gray"
                onClick={() => setTags([])}
              >
                Clear tags
              </Button>
            </Group>
          )}
          <Group className="results-heading" justify="space-between">
            <Text size="sm">
              <b>{filtered.length} people</b>{" "}
              <span className="muted">with something in common</span>
            </Text>
            <Text size="xs" c="dimmed">
              {mapped.length} on the map · {cities.size} cities
            </Text>
          </Group>
          {view === "map" ? (
            <div className="map-layout">
              <section className="map-panel" aria-label="Community map">
                <Suspense
                  fallback={
                    <div className="loading">
                      <Loader />
                    </div>
                  }
                >
                  <PeopleMap
                    people={filtered}
                    focus={selected}
                    onSelect={setSelected}
                    reset={reset}
                  />
                </Suspense>
                <Button
                  className="fit-map"
                  size="xs"
                  variant="white"
                  color="dark"
                  leftSection={<IconFocusCentered size={16} />}
                  onClick={() => {
                    setSelected(null);
                    setReset((v) => v + 1);
                  }}
                >
                  Fit everyone
                </Button>
                <div className="map-legend">
                  <span>
                    <i className="dot mentor" />
                    Mentor
                  </span>
                  <span>
                    <i className="dot mentee" />
                    Mentee
                  </span>
                </div>
                {!mapped.length && (
                  <div className="map-empty">
                    <Text fw={700}>No mapped locations in this selection</Text>
                    <Text size="sm" c="dimmed">
                      Try different filters or explore the directory.
                    </Text>
                  </div>
                )}
              </section>
              <section className="people-panel">
                <Group justify="space-between" p="md">
                  <Text fw={700} size="sm">
                    Meet the community
                  </Text>
                  <Badge variant="light" color="gray">
                    {filtered.length}
                  </Badge>
                </Group>
                <ScrollArea className="people-scroll">
                  {filtered.map(card)}
                </ScrollArea>
              </section>
            </div>
          ) : (
            <div className="directory">
              {filtered.map(card)}
              {!filtered.length && (
                <div className="empty">
                  <Text fw={700}>No matches yet</Text>
                  <Text size="sm" c="dimmed">
                    Try clearing a filter or broadening the search.
                  </Text>
                </div>
              )}
            </div>
          )}
          <footer>
            <Text size="xs" c="dimmed">
              City-level locations only · No precise addresses
            </Text>
            <Text size="xs" c="dimmed">
              Fall 2026 introductions
            </Text>
          </footer>
        </main>
      </div>
      <Drawer
        opened={mobileFilters}
        onClose={() => setMobileFilters(false)}
        title="Find your people"
        padding="md"
      >
        {filters}
      </Drawer>
      <Drawer
        opened={!!selected}
        onClose={() => setSelected(null)}
        position="right"
        size="md"
        title={selected?.name}
      >
        {selected && (
          <Stack>
            <Group>
              <Avatar color={roleColor(selected)} size="lg" radius="xl">
                {initials(selected.name)}
              </Avatar>
              <div>
                <Badge color={roleColor(selected)} variant="light">
                  {selected.roles.join(" + ")}
                </Badge>
                <Text size="sm" c="dimmed" mt={5}>
                  {selected.location?.city || selected.locationText || "Location not stated"}
                </Text>
              </div>
            </Group>
            {selected.project && (
              <div>
                <Text size="xs" fw={700} c="dimmed" mb={4}>
                  SPAR PROJECT
                </Text>
                {selected.projectUrl ? (
                  <Button
                    component="a"
                    href={selected.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="subtle"
                    size="compact-sm"
                    px={0}
                    rightSection={<IconArrowUpRight size={14} />}
                  >
                    {selected.project}
                  </Button>
                ) : (
                  <Text size="sm">{selected.project}</Text>
                )}
              </div>
            )}
            <Divider />
            <Text size="sm" className="intro-copy">
              {selected.intro}
            </Text>
            {!!selected.tags.length && (
              <Group gap={6}>
                {selected.tags.map((t) => (
                  <Badge key={`${t.category}:${t.label}`} variant="light" color="gray">
                    {t.label}
                  </Badge>
                ))}
              </Group>
            )}
            <Divider />
            <Group>
              <Button
                component="a"
                href={selected.slackUrl}
                target="_blank"
                rel="noreferrer"
                leftSection={<IconBrandSlack size={16} />}
              >
                Message on Slack
              </Button>
              <Button
                component="a"
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer"
                variant="default"
                rightSection={<IconArrowUpRight size={14} />}
              >
                Introduction
              </Button>
            </Group>
          </Stack>
        )}
      </Drawer>
    </div>
  );
}
