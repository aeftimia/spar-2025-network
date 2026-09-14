import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Button, Text, Stack, Badge, Alert } from "@mantine/core";
import type { Person } from "./types";
function Camera({
  people,
  focus,
  reset,
}: {
  people: Person[];
  focus: Person | null;
  reset: number;
}) {
  const map = useMap();
  useEffect(() => {
    const points = people.flatMap((p) =>
      p.location ? [[p.location.lat, p.location.lng] as [number, number]] : [],
    );
    if (points.length)
      map.fitBounds(points, { padding: [55, 55], maxZoom: 8, animate: false });
    else map.setView([25, 0], 2);
  }, [people, reset, map]);
  useEffect(() => {
    if (focus?.location)
      map.flyTo(
        [focus.location.lat, focus.location.lng],
        Math.max(7, map.getZoom()),
        { duration: 0.6 },
      );
  }, [focus, map]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
export default function PeopleMap({
  people,
  focus,
  onSelect,
  reset,
}: {
  people: Person[];
  focus: Person | null;
  onSelect: (p: Person) => void;
  reset: number;
}) {
  const [tileError, setTileError] = useState(false);
  const groups = useMemo(() => {
    const g = new Map<string, Person[]>();
    people.forEach((p) => {
      if (p.location) {
        const key = `${p.location.lat},${p.location.lng}`;
        g.set(key, [...(g.get(key) || []), p]);
      }
    });
    return [...g.values()];
  }, [people]);
  return (
    <>
      <MapContainer
        center={[25, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom
        className="people-map"
        worldCopyJump
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />
        <Camera people={people} focus={focus} reset={reset} />
        {groups.map((group) => {
          const p = group[0];
          const selected = group.some((x) => x.id === focus?.id);
          const color = group.some((x) => x.roles.includes("mentor"))
            ? "mentor"
            : group.some((x) => x.roles.includes("mentee"))
              ? "mentee"
              : "unknown";
          return (
            <Marker
              key={`${p.location!.lat},${p.location!.lng}`}
              position={[p.location!.lat, p.location!.lng]}
              icon={L.divIcon({
                className: "marker-wrapper",
                html: `<span class="map-marker ${color} ${selected ? "selected" : ""}">${group.length}</span>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
              })}
              title={`${p.location!.city}: ${group.length} people`}
            >
              <Popup>
                <Stack gap="xs">
                  <Text fw={700}>{p.location!.city}</Text>
                  <Text size="xs" c="dimmed">
                    City-level location · {group.length} people
                  </Text>
                  <div className="popup-people">
                    {group.map((person) => (
                      <Button
                        key={person.id}
                        variant="subtle"
                        fullWidth
                        justify="space-between"
                        onClick={() => onSelect(person)}
                        rightSection={
                          <Badge
                            size="xs"
                            color={
                              person.roles.includes("mentor")
                                ? "violet"
                                : "teal"
                            }
                          >
                            {person.roles[0] === "unknown"
                              ? "Member"
                              : person.roles[0]}
                          </Badge>
                        }
                      >
                        {person.name}
                      </Button>
                    ))}
                  </div>
                </Stack>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {tileError && (
        <Alert color="orange" className="map-error">
          Map tiles could not load. You can still browse everyone in the
          directory.
        </Alert>
      )}
    </>
  );
}
