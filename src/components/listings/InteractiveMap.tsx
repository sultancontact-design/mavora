/**
 * Interactive Map Component for Listings
 * Displays listings on an interactive map using Leaflet
 * Supports clustering, filtering, and Arabic/RTL layout
 * 
 * @module components/listings/InteractiveMap
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Types
interface MapListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  latitude: number;
  longitude: number;
  category: string;
  categoryColor?: string;
  imageUrl?: string;
  sellerName: string;
}

interface InteractiveMapProps {
  listings: MapListing[];
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  onListingClick?: (listing: MapListing) => void;
  onMapMove?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  className?: string;
  height?: string;
  showControls?: boolean;
  clusterEnabled?: boolean;
  selectedListingId?: string;
}

// Morocco default center (Casablanca)
const MOROCCO_CENTER: [number, number] = [33.5731, -7.5898];
const DEFAULT_ZOOM = 6;

// Category colors for map markers
const CATEGORY_COLORS: Record<string, string> = {
  electronics: '#3B82F6',     // Blue
  vehicles: '#EF4444',         // Red
  property: '#10B981',         // Green
  fashion: '#F59E0B',          // Amber
  home: '#8B5CF6',             // Purple
  jobs: '#06B6D4',             // Cyan
  services: '#EC4899',         // Pink
  other: '#6B7280',            // Gray
};

export function InteractiveMap({
  listings,
  center = MOROCCO_CENTER,
  zoom = DEFAULT_ZOOM,
  onListingClick,
  onMapMove,
  className = '',
  height = '500px',
  showControls = true,
  clusterEnabled = true,
  selectedListingId,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // Leaflet map instance
  const markersRef = useRef<Map<string, any>>(new Map());
  const clusterGroupRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let L: any;
    let map: any;

    const initMap = async () => {
      // Dynamically import Leaflet
      try {
        // Import leaflet CSS
        await import('leaflet/dist/leaflet.css');
        
        // Import marker icons fix
        const markerIcon2x = await import('leaflet/dist/images/marker-icon-2x.png');
        const markerIcon = await import('leaflet/dist/images/marker-icon.png');
        const markerShadow = await import('leaflet/dist/images/marker-shadow.png');

        L = (await import('leaflet')).default;

        // Fix default marker icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: markerIcon2x.default,
          iconUrl: markerIcon.default,
          shadowUrl: markerShadow.default,
        });

        // Initialize map
        map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: showControls,
          attributionControl: true,
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Initialize marker cluster group if enabled
        if (clusterEnabled) {
          const markerClusterGroup = (await import('leaflet.markercluster')).default;
          clusterGroupRef.current = markerClusterGroup.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
          });
          clusterGroupRef.current.addTo(map);
        }

        // Handle move end event
        map.on('moveend', () => {
          const bounds = map.getBounds();
          onMapMove?.({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          });
        });

        mapRef.current = map;
        setIsLoaded(true);

      } catch (error) {
        console.error('[InteractiveMap] Failed to initialize map:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update markers when listings change
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      // Add new markers
      for (const listing of listings) {
        if (listing.latitude && listing.longitude) {
          const color = CATEGORY_COLORS[listing.category.toLowerCase()] || CATEGORY_COLORS.other;
          
          // Create custom icon
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                background-color: ${color};
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                <span style="transform: rotate(45deg); color: white; font-size: 12px; font-weight: bold;">
                  ${listing.price >= 1000 ? `${Math.round(listing.price / 1000)}k` : listing.price}
                </span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          });

          const marker = L.marker([listing.latitude, listing.longitude], { icon });
          
          // Create popup content
          const popupContent = `
            <div style="direction: rtl; min-width: 200px; font-family: system-ui, sans-serif;" class="map-popup">
              ${listing.imageUrl ? `<img src="${listing.imageUrl}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px 8px 0 0;" />` : ''}
              <div style="padding: 12px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${listing.title}</h3>
                <p style="margin: 0 0 4px 0; color: #16a34a; font-weight: bold; font-size: 16px;">
                  ${listing.price.toLocaleString('ar-MA')} ${listing.currency}
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 12px;">${listing.sellerName}</p>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 250,
            className: 'custom-popup',
          });

          // Click handler
          marker.on('click', () => {
            setSelectedListing(listing);
            onListingClick?.(listing);
          });

          // Highlight selected listing
          if (listing.id === selectedListingId) {
            marker.openPopup();
          }

          // Add to cluster group or map directly
          if (clusterGroupRef.current) {
            clusterGroupRef.current.addLayer(marker);
          } else {
            marker.addTo(mapRef.current);
          }

          markersRef.current.set(listing.id, marker);
        }
      }
    };

    updateMarkers();
  }, [listings, isLoaded, selectedListingId, onListingClick, clusterEnabled]);

  // Fit bounds to show all markers
  const fitBounds = useCallback(() => {
    if (!mapRef.current || markersRef.current.size === 0) return;

    const L = require('leaflet'); // Already loaded at this point
    const group = L.featureGroup(Array.from(markersRef.current.values()));
    mapRef.current.fitBounds(group.getBounds().pad(0.1));
  }, []);

  // Reset view to initial center
  const resetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Toggle cluster mode
  const toggleCluster = useCallback(async () => {
    if (!mapRef.current) return;

    const L = (await import('leaflet')).default;

    if (clusterGroupRef.current) {
      // Remove from cluster and add directly to map
      markersRef.current.forEach((marker) => {
        clusterGroupRef.current.removeLayer(marker);
        marker.addTo(mapRef.current);
      });
      mapRef.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    } else {
      // Create new cluster group
      const markerClusterGroup = (await import('leaflet.markercluster')).default;
      clusterGroupRef.current = markerClusterGroup.markerClusterGroup({
        chunkedLoading: true,
      }).addTo(mapRef.current);

      // Move all markers to cluster
      markersRef.current.forEach((marker) => {
        mapRef.current.removeLayer(marker);
        clusterGroupRef.current.addLayer(marker);
      });
    }
  }, []);

  if (!isLoaded) {
    return (
      <div
        ref={mapContainerRef}
        className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">جاري تحميل الخريطة...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="rounded-lg overflow-hidden shadow-sm border border-gray-200"
        style={{ height }}
      />

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={fitBounds}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="عرض كل الإعلانات"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={resetView}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="إعادة تعيين الخريطة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={toggleCluster}
            className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="تبديل التجميع"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
        </div>
      )}

      {/* Selected Listing Card */}
      {selectedListing && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs rtl:dir">
          <button
            onClick={() => setSelectedListing(null)}
            className="absolute top-2 left-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          {selectedListing.imageUrl && (
            <img
              src={selectedListing.imageUrl}
              alt={selectedListing.title}
              className="w-full h-32 object-cover rounded-md mb-2"
            />
          )}
          <h3 className="font-semibold text-gray-900 mb-1">{selectedListing.title}</h3>
          <p className="text-green-600 font-bold text-lg mb-1">
            {selectedListing.price.toLocaleString('ar-MA')} {selectedListing.currency}
          </p>
          <p className="text-gray-500 text-sm mb-2">البائع: {selectedListing.sellerName}</p>
          <button
            onClick={() => onListingClick?.(selectedListing)}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
          >
            عرض التفاصيل
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <p className="text-xs font-medium text-gray-700 mb-2">الفئات</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              <span className="text-xs text-gray-600 capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          display: none;
        }
        .map-popup img {
          border-radius: 8px 8px 0 0;
        }
      `}</style>
    </div>
  );
}

// Hook for geocoding (address to coordinates)
export function useGeocode() {
  const geocode = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ma&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error('[Geocode] Error:', error);
      return null;
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      return data?.display_name || null;
    } catch (error) {
      console.error('[ReverseGeocode] Error:', error);
      return null;
    }
  }, []);

  return { geocode, reverseGeocode };
}

// Hook for user location
export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, []);

  return { location, loading, error, getLocation };
}

export default InteractiveMap;
