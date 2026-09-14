import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@mantine/core";
import type { Person } from "./types";

declare const mapboxgl: any;

const ROLE_COLORS = {
  mentor: "#8864c9",
  mentee: "#159783",
};

function roleFor(group: Person[]) {
  return group.some((person) => person.roles.includes("mentor"))
    ? "mentor"
    : "mentee";
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
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const token = import.meta.env.VITE_PUBLIC_MAPBOX_TOKEN as string | undefined;

  const groups = useMemo(() => {
    const grouped = new Map<string, Person[]>();
    people.forEach((person) => {
      if (!person.location) return;
      const key = `${person.location.lat},${person.location.lng}`;
      grouped.set(key, [...(grouped.get(key) || []), person]);
    });
    return [...grouped.values()];
  }, [people]);

  useEffect(() => {
    if (!containerRef.current || !token || typeof mapboxgl === "undefined") return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [0, 25],
      zoom: 1.5,
      minZoom: 1.5,
      maxZoom: 18,
      attributionControl: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-left",
    );
    map.on("error", (event: any) => {
      const message = event?.error?.message;
      if (message) setMapError(message);
    });
    map.on("load", () => setMapError(null));

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    mapRef.current = map;

    return () => {
      observer.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    groups.forEach((group) => {
      const first = group[0];
      if (!first.location) return;

      const role = roleFor(group);
      const popupContent = document.createElement("div");
      popupContent.className = "mapbox-popup-content";

      const heading = document.createElement("div");
      heading.className = "mapbox-popup-heading";
      heading.textContent = first.location.city;
      popupContent.appendChild(heading);

      const subheading = document.createElement("div");
      subheading.className = "mapbox-popup-subheading";
      subheading.textContent = `City-level location · ${group.length} ${group.length === 1 ? "person" : "people"}`;
      popupContent.appendChild(subheading);

      const peopleList = document.createElement("div");
      peopleList.className = "popup-people";
      group.forEach((person) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mapbox-person-button";
        button.textContent = person.name;
        button.addEventListener("click", () => onSelect(person));
        peopleList.appendChild(button);
      });
      popupContent.appendChild(peopleList);

      const popup = new mapboxgl.Popup({
        offset: 28,
        closeButton: true,
        maxWidth: "300px",
      }).setDOMContent(popupContent);

      const marker = new mapboxgl.Marker({
        color: ROLE_COLORS[role],
        scale: group.some((person) => person.id === focus?.id) ? 1.15 : 1,
      })
        .setLngLat([first.location.lng, first.location.lat])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().setAttribute(
        "aria-label",
        `${first.location.city}: ${group.length} ${group.length === 1 ? "person" : "people"}`,
      );
      marker.getElement().classList.add("community-map-marker", role);
      markersRef.current.push(marker);
    });
  }, [groups, focus?.id, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const points = people.flatMap((person) =>
      person.location
        ? [[person.location.lng, person.location.lat] as [number, number]]
        : [],
    );

    if (!points.length) {
      map.easeTo({ center: [0, 25], zoom: 1.5, duration: 0 });
      return;
    }

    if (points.length === 1) {
      map.easeTo({ center: points[0], zoom: 7, duration: 0 });
      return;
    }

    const bounds = points.reduce(
      (acc, point) => acc.extend(point),
      new mapboxgl.LngLatBounds(points[0], points[0]),
    );
    map.fitBounds(bounds, { padding: 55, maxZoom: 8, duration: 0 });
  }, [people, reset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus?.location) return;
    map.flyTo({
      center: [focus.location.lng, focus.location.lat],
      zoom: Math.max(7, map.getZoom()),
      essential: true,
    });
  }, [focus]);

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
