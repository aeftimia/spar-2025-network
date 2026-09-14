import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@mantine/core";
import type { Person } from "./types";

declare const mapboxgl: any;

const SOURCE_ID = "community-locations";
const LAYER_ID = "community-pins";
const USER_SOURCE_ID = "user-location";
const USER_LAYER_ID = "user-location-dot";
const MENTOR_ICON = "mentor-pin";
const MENTEE_ICON = "mentee-pin";
const ROLE_COLORS = {
  mentor: "#2563eb",
  mentee: "#dc2626",
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

function regionBounds(lat: number, lng: number, radiusMiles = 50) {
  const latDelta = radiusMiles / 69;
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const lngDelta = radiusMiles / (69 * cosLat);
  return [
    [lng - lngDelta, lat - latDelta],
    [lng + lngDelta, lat + latDelta],
  ];
}

function fitRegion(map: any, lat: number, lng: number, animated = false) {
  map.fitBounds(regionBounds(lat, lng, 50), {
    padding: 55,
    maxZoom: 10,
    duration: animated ? 650 : 0,
    essential: animated,
  });
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
    fitRegion(map, points[0][1], points[0][0], animated);
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

function showUserLocation(map: any, lat: number, lng: number) {
  const data = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {},
      },
    ],
  };
  const source = map.getSource(USER_SOURCE_ID);
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource(USER_SOURCE_ID, { type: "geojson", data });
  map.addLayer({
    id: USER_LAYER_ID,
    type: "circle",
    source: USER_SOURCE_ID,
    paint: {
      "circle-radius": 6,
      "circle-color": "#2563eb",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
      "circle-opacity": 0.9,
    },
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
  onSelect: (person: Person) => void;
  reset: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const peopleRef = useRef(people);
  const groupByKeyRef = useRef(new Map<string, Person[]>());
  const onSelectRef = useRef(onSelect);
  const lastResetRef = useRef(reset);
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
            role: roleFor(group),
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
            "icon-size": ["case", ["==", ["get", "selected"], 1], 1.12, 1],
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

        setMapReady(true);
        setMapError(null);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              showUserLocation(map, coords.latitude, coords.longitude);
              fitRegion(map, coords.latitude, coords.longitude, false);
            },
            () => fitPeople(map, peopleRef.current, false),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
          );
        } else {
          fitPeople(map, peopleRef.current, false);
        }
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
    map.getSource(SOURCE_ID)?.setData(geojson);
  }, [geojson, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || reset === lastResetRef.current) return;
    lastResetRef.current = reset;
    fitPeople(map, peopleRef.current, true);
  }, [reset, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !focus?.location) return;
    fitRegion(map, focus.location.lat, focus.location.lng, true);
  }, [focus?.id, mapReady]);

  if (!token) {
    return (
      <Alert color="orange" className="map-error">
        Mapbox access token is not configured. Run through SST or set
        VITE_PUBLIC_MAPBOX_TOKEN.
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
