import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@mantine/core";
import type { Person } from "./types";

declare const mapboxgl: any;

const SOURCE_ID = "community-locations";
const LAYER_ID = "community-pins";
const MENTOR_ICON = "mentor-pin";
const MENTEE_ICON = "mentee-pin";
const ROLE_COLORS = {
  mentor: "#8864c9",
  mentee: "#159783",
};

function roleFor(group: Person[]) {
  return group.some((person) => person.roles.includes("mentor"))
    ? "mentor"
    : "mentee";
}

function pinSvg(color: string) {
  return `
    <svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="6.25" fill="#fff"/>
      <circle cx="14" cy="14" r="3.25" fill="${color}"/>
    </svg>`;
}

function addPinIcon(map: any, name: string, color: string) {
  return new Promise<void>((resolve, reject) => {
    if (map.hasImage(name)) {
      resolve();
      return;
    }
    const image = new Image(28, 40);
    image.onload = () => {
      if (!map.hasImage(name)) map.addImage(name, image);
      resolve();
    };
    image.onerror = () => reject(new Error(`Could not create ${name}`));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pinSvg(color))}`;
  });
}

function regionBounds(lat: number, lng: number, radiusMiles = 100) {
  const latDelta = radiusMiles / 69;
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const lngDelta = radiusMiles / (69 * cosLat);
  return [
    [lng - lngDelta, lat - latDelta],
    [lng + lngDelta, lat + latDelta],
  ];
}

function fitPeople(map: any, people: Person[], animated = false) {
  const points = people.flatMap((person) =>
    person.location
      ? [[person.location.lng, person.location.lat] as [number, number]]
      : [],
  );

  if (!points.length) {
    map.easeTo({ center: [0, 25], zoom: 1.5, duration: animated ? 450 : 0 });
    return;
  }

  if (points.length === 1) {
    map.fitBounds(regionBounds(points[0][1], points[0][0]), {
      padding: 50,
      maxZoom: 8,
      duration: animated ? 550 : 0,
    });
    return;
  }

  const bounds = points.reduce(
    (acc, point) => acc.extend(point),
    new mapboxgl.LngLatBounds(points[0], points[0]),
  );
  map.fitBounds(bounds, {
    padding: 55,
    maxZoom: 8,
    duration: animated ? 550 : 0,
  });
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const peopleRef = useRef(people);
  const groupByKeyRef = useRef(new Map<string, Person[]>());
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const token = import.meta.env.VITE_PUBLIC_MAPBOX_TOKEN as string | undefined;

  peopleRef.current = people;
  onSelectRef.current = onSelect;

  const groups = useMemo(() => {
    const grouped = new Map<string, Person[]>();
    people.forEach((person) => {
      if (!person.location) return;
      const key = `${person.location.lat},${person.location.lng}`;
      grouped.set(key, [...(grouped.get(key) || []), person]);
    });
    groupByKeyRef.current = grouped;
    return [...grouped.entries()];
  }, [people]);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: groups.map(([key, group]) => {
        const first = group[0];
        const role = roleFor(group);
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [first.location!.lng, first.location!.lat],
          },
          properties: {
            key,
            city: first.location!.city,
            count: group.length,
            role,
            selected: group.some((person) => person.id === focus?.id) ? 1 : 0,
          },
        };
      }),
    }),
    [groups, focus?.id],
  );

  useEffect(() => {
    if (!containerRef.current || !token || typeof mapboxgl === "undefined") return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 25],
      zoom: 1.5,
      minZoom: 1.5,
      maxZoom: 18,
      attributionControl: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-left",
    );

    const showPopup = (feature: any) => {
      const key = feature?.properties?.key;
      const group = key ? groupByKeyRef.current.get(key) : undefined;
      if (!group?.length) return;

      popupRef.current?.remove();
      const first = group[0];
      const content = document.createElement("div");
      content.className = "mapbox-popup-content";

      const heading = document.createElement("div");
      heading.className = "mapbox-popup-heading";
      heading.textContent = first.location!.city;
      content.appendChild(heading);

      const subheading = document.createElement("div");
      subheading.className = "mapbox-popup-subheading";
      subheading.textContent = `City-level location · ${group.length} ${group.length === 1 ? "person" : "people"}`;
      content.appendChild(subheading);

      const list = document.createElement("div");
      list.className = "popup-people";
      group.forEach((person) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mapbox-person-button";
        button.textContent = person.name;
        button.addEventListener("click", () => onSelectRef.current(person));
        list.appendChild(button);
      });
      content.appendChild(list);

      popupRef.current = new mapboxgl.Popup({
        offset: 24,
        closeButton: true,
        maxWidth: "300px",
      })
        .setLngLat(feature.geometry.coordinates)
        .setDOMContent(content)
        .addTo(map);
    };

    map.on("error", (event: any) => {
      const message = event?.error?.message;
      if (message) setMapError(message);
    });

    map.on("load", async () => {
      try {
        await Promise.all([
          addPinIcon(map, MENTOR_ICON, ROLE_COLORS.mentor),
          addPinIcon(map, MENTEE_ICON, ROLE_COLORS.mentee),
        ]);

        map.addSource(SOURCE_ID, { type: "geojson", data: geojson });
        map.addLayer({
          id: LAYER_ID,
          type: "symbol",
          source: SOURCE_ID,
          layout: {
            "icon-image": [
              "match",
              ["get", "role"],
              "mentor",
              MENTOR_ICON,
              MENTEE_ICON,
            ],
            "icon-size": [
              "case",
              ["==", ["get", "selected"], 1],
              1.12,
              1,
            ],
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
        });

        map.on("click", LAYER_ID, (event: any) => {
          const feature = event.features?.[0];
          if (feature) showPopup(feature);
        });
        map.on("mouseenter", LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });

        fitPeople(map, peopleRef.current);
        setMapReady(true);
        setMapError(null);
      } catch (error) {
        setMapError(error instanceof Error ? error.message : "Map could not load");
      }
    });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    mapRef.current = map;

    return () => {
      observer.disconnect();
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const source = map.getSource(SOURCE_ID);
    source?.setData(geojson);
  }, [geojson, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    fitPeople(map, people, reset !== 0);
  }, [people, reset, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !focus?.location) return;
    const { lat, lng } = focus.location;
    map.fitBounds(regionBounds(lat, lng, 100), {
      padding: 55,
      maxZoom: 8,
      duration: 650,
      essential: true,
    });
  }, [focus?.id, mapReady]);

  if (!token) {
    return (
      <Alert color="orange" className="map-error">
        Mapbox access token is not configured. Set VITE_PUBLIC_MAPBOX_TOKEN, or
        run through SST so it is injected from the stage-specific token.
      </Alert>
    );
  }

  return (
    <>
      <div ref={containerRef} className="people-map" />
      {mapError && (
        <Alert color="orange" className="map-error">
          The Mapbox map could not load. You can still browse everyone in the
          directory.
        </Alert>
      )}
    </>
  );
}
