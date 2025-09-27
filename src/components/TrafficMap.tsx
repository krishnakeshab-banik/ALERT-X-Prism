import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Extend Window interface to include Leaflet
declare global {
  interface Window {
    L: any;
  }
}

export function TrafficMap({ showControls = true }: { showControls?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const heatmapData = useQuery(api.traffic.getTrafficHeatmapData, {});
  const incidents = useQuery(api.incidents.listIncidents, {});

  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (typeof window !== "undefined" && !window.L) {
        // Load Leaflet CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => setIsLoaded(true);
        document.head.appendChild(script);
      } else if (window.L) {
        setIsLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = window.L.map(mapRef.current).setView([12.9716, 77.5946], 12);

    // Add tile layer
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !heatmapData || !incidents) return;

    const map = mapInstanceRef.current;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer.options && (layer.options.isHeatmap || layer.options.isIncident)) {
        map.removeLayer(layer);
      }
    });

    // Add traffic heatmap circles
    heatmapData.forEach((point) => {
      const color = 
        point.trafficIntensity === "high" ? "#ef4444" :
        point.trafficIntensity === "medium" ? "#f59e0b" : "#10b981";

      const circle = window.L.circle([point.lat, point.lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        radius: 500,
        isHeatmap: true,
      }).addTo(map);

      circle.bindPopup(`
        <div class="text-sm">
          <h4 class="font-semibold">${point.cameraName}</h4>
          <p>Traffic: ${point.trafficIntensity}</p>
          <p>Vehicles: ${point.vehicleCount.cars + point.vehicleCount.bikes + point.vehicleCount.trucks + point.vehicleCount.buses}</p>
          <p>People: ${point.peopleCount}</p>
          <p class="text-xs text-gray-500">Updated: ${new Date(point.timestamp).toLocaleTimeString()}</p>
        </div>
      `);
    });

    // Add incident markers
    incidents.forEach((incident) => {
      const iconMap = {
        accident: "🚗💥",
        fire: "🔥",
        crowd: "👥",
        unauthorized_movement: "⚠️",
        traffic_jam: "🚦",
      };

      const marker = window.L.marker([incident.location.lat, incident.location.lng], {
        icon: window.L.divIcon({
          html: `<div style="background: #1f2937; color: white; padding: 4px 8px; border-radius: 4px; font-size: 16px; border: 2px solid #ef4444;">${iconMap[incident.type]}</div>`,
          className: "custom-incident-marker",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
        isIncident: true,
      }).addTo(map);

      marker.bindPopup(`
        <div class="text-sm">
          <h4 class="font-semibold text-red-600">${incident.type.replace("_", " ").toUpperCase()}</h4>
          <p>${incident.description}</p>
          <p class="text-xs">Severity: <span class="font-semibold">${incident.severity}</span></p>
          <p class="text-xs">Status: <span class="font-semibold">${incident.status}</span></p>
          <p class="text-xs text-gray-500">${new Date(incident._creationTime).toLocaleString()}</p>
        </div>
      `);
    });
  }, [heatmapData, incidents]);

  if (!isLoaded) {
    return (
      <div className="h-[600px] bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showControls && (
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Live Traffic Map</h3>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Traffic</span>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium Traffic</span>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Traffic</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Updates every 30 seconds
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="h-[600px] rounded-lg border border-gray-700"
        style={{ background: "#1f2937" }}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🚗💥</span>
            <span>Accidents</span>
          </div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔥</span>
            <span>Fire Incidents</span>
          </div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🚦</span>
            <span>Traffic Jams</span>
          </div>
        </div>
      </div>
    </div>
  );
}
