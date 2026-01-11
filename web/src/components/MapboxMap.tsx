/**
 * Mapbox Map Component
 * Displays events on an interactive map
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

interface MapboxMapProps {
  events: any[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  onEventClick?: (event: any) => void;
  className?: string;
}

export function MapboxMap({
  events,
  center = [36.8219, -1.2921], // Nairobi
  zoom = 11,
  onEventClick,
  className = 'w-full h-96'
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add event markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    events.forEach(event => {
      if (!event.longitude || !event.latitude) return;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.style.backgroundImage = `url(${event.image_url || ''})`;
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundSize = 'cover';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid #FF6B35';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';

      el.addEventListener('click', () => {
        onEventClick?.(event);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.longitude, event.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: 600; margin-bottom: 4px; color: #fff;">${event.title}</h3>
              <p style="font-size: 12px; color: #aaa; margin-bottom: 4px;">${event.venue_name || ''}</p>
              <p style="font-size: 12px; color: #FF6B35; font-weight: 600;">${event.price_range || 'Free'}</p>
            </div>
          `)
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (events.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      events.forEach(event => {
        if (event.longitude && event.latitude) {
          bounds.extend([event.longitude, event.latitude]);
        }
      });
      map.current?.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [events, mapLoaded]);

  return <div ref={mapContainer} className={className} />;
}
