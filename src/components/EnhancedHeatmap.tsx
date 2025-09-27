import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Extend Window interface to include Leaflet
declare global {
  interface Window {
    L: any;
  }
}

interface HeatmapData {
  lat: number;
  lng: number;
  intensity: number;
  trafficIntensity: "low" | "medium" | "high";
  vehicleCount: {
    cars: number;
    bikes: number;
    trucks: number;
    buses: number;
  };
  peopleCount: number;
  cameraName: string;
  timestamp: number;
  incidentTypes?: string[];
  lastIncident?: string;
}

export function EnhancedHeatmap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null);
  
  const heatmapData = useQuery(api.traffic.getTrafficHeatmapData, {});
  const incidents = useQuery(api.incidents.listIncidents, {});

  // Color coding for traffic levels
  const getTrafficColor = (intensity: "low" | "medium" | "high", congestionLevel: number) => {
    switch (intensity) {
      case "high":
        return {
          color: "#ef4444", // Red
          fillColor: "#ef4444",
          fillOpacity: 0.6,
          weight: 3
        };
      case "medium":
        return {
          color: "#f59e0b", // Orange
          fillColor: "#f59e0b",
          fillOpacity: 0.4,
          weight: 2
        };
      case "low":
        return {
          color: "#10b981", // Green
          fillColor: "#10b981",
          fillOpacity: 0.3,
          weight: 1
        };
      default:
        return {
          color: "#6b7280", // Gray
          fillColor: "#6b7280",
          fillOpacity: 0.2,
          weight: 1
        };
    }
  };

  // Get incident color based on type
  const getIncidentColor = (type: string) => {
    switch (type) {
      case "fire":
        return "#ff4444"; // Bright red
      case "accident":
        return "#ff8800"; // Orange
      case "crowd":
        return "#ffaa00"; // Yellow-orange
      case "traffic_jam":
        return "#ff0000"; // Dark red
      case "unauthorized_movement":
        return "#ff6600"; // Red-orange
      default:
        return "#6b7280"; // Gray
    }
  };

  // Load Leaflet
  useEffect(() => {
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

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = window.L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true
    });

    // Add custom tile layer
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  // Update heatmap when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !heatmapData || !incidents) return;

    const map = mapInstanceRef.current;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer.options && (layer.options.isHeatmap || layer.options.isIncident)) {
        map.removeLayer(layer);
      }
    });

    // Create heatmap data points
    const heatmapPoints = heatmapData.map((point: HeatmapData) => ({
      lat: point.lat,
      lng: point.lng,
      value: point.intensity * 100, // Scale intensity
      trafficIntensity: point.trafficIntensity,
      vehicleCount: point.vehicleCount,
      peopleCount: point.peopleCount,
      cameraName: point.cameraName,
      timestamp: point.timestamp
    }));

    // Add traffic heatmap circles with enhanced visualization
    heatmapData.forEach((point: HeatmapData) => {
      const trafficColor = getTrafficColor(point.trafficIntensity, point.intensity * 100);
      const radius = point.trafficIntensity === "high" ? 800 : 
                   point.trafficIntensity === "medium" ? 600 : 400;

      // Main traffic circle
      const circle = window.L.circle([point.lat, point.lng], {
        color: trafficColor.color,
        fillColor: trafficColor.fillColor,
        fillOpacity: trafficColor.fillOpacity,
        radius: radius,
        weight: trafficColor.weight,
        isHeatmap: true,
      }).addTo(map);

      // Add pulsing animation for high traffic
      if (point.trafficIntensity === "high") {
        const pulsingCircle = window.L.circle([point.lat, point.lng], {
          color: trafficColor.color,
          fillColor: trafficColor.fillColor,
          fillOpacity: 0.1,
          radius: radius * 1.5,
          weight: 1,
          isHeatmap: true,
        }).addTo(map);
      }

      // Add border circle for better visibility
      const borderCircle = window.L.circle([point.lat, point.lng], {
        color: trafficColor.color,
        fillColor: "transparent",
        fillOpacity: 0,
        radius: radius + 50,
        weight: 2,
        dashArray: "5, 5",
        isHeatmap: true,
      }).addTo(map);

      // Enhanced popup with detailed information
      const totalVehicles = point.vehicleCount.cars + point.vehicleCount.bikes + 
                           point.vehicleCount.trucks + point.vehicleCount.buses;

      circle.bindPopup(`
        <div class="text-sm min-w-[250px]">
          <div class="flex items-center space-x-2 mb-3">
            <div class="w-4 h-4 rounded-full" style="background-color: ${trafficColor.color}"></div>
            <h4 class="font-bold text-lg">${point.cameraName}</h4>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Traffic Level:</span>
              <span class="font-semibold" style="color: ${trafficColor.color}">
                ${point.trafficIntensity.toUpperCase()}
              </span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Total Vehicles:</span>
              <span class="font-semibold">${totalVehicles}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex justify-between">
                <span>🚗 Cars:</span>
                <span>${point.vehicleCount.cars}</span>
              </div>
              <div class="flex justify-between">
                <span>🏍️ Bikes:</span>
                <span>${point.vehicleCount.bikes}</span>
              </div>
              <div class="flex justify-between">
                <span>🚛 Trucks:</span>
                <span>${point.vehicleCount.trucks}</span>
              </div>
              <div class="flex justify-between">
                <span>🚌 Buses:</span>
                <span>${point.vehicleCount.buses}</span>
              </div>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">People:</span>
              <span class="font-semibold">${point.peopleCount}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Congestion:</span>
              <span class="font-semibold">${Math.round(point.intensity * 100)}%</span>
            </div>
            
            <div class="text-xs text-gray-500 mt-3 pt-2 border-t">
              Updated: ${new Date(point.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      `);
    });

    // Add incident markers with enhanced visualization
    incidents.forEach((incident) => {
      const incidentColor = getIncidentColor(incident.type);
      const severity = incident.severity;
      const size = severity === "critical" ? 50 : severity === "high" ? 40 : 30;

      const iconMap = {
        accident: "🚗💥",
        fire: "🔥",
        crowd: "👥",
        unauthorized_movement: "⚠️",
        traffic_jam: "🚦",
      };

      const marker = window.L.marker([incident.location.lat, incident.location.lng], {
        icon: window.L.divIcon({
          html: `
            <div style="
              background: ${incidentColor}; 
              color: white; 
              padding: 8px 12px; 
              border-radius: 10px; 
              font-size: 18px; 
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              animation: ${severity === "critical" ? "pulse 1s infinite" : "none"};
              min-width: ${size}px;
              text-align: center;
            ">
              ${iconMap[incident.type as keyof typeof iconMap]}
            </div>
          `,
          className: "custom-incident-marker",
          iconSize: [size, size],
          iconAnchor: [size/2, size/2],
        }),
        isIncident: true,
      }).addTo(map);

      // Enhanced incident popup
      marker.bindPopup(`
        <div class="text-sm min-w-[280px]">
          <div class="flex items-center space-x-2 mb-3">
            <span class="text-2xl">${iconMap[incident.type as keyof typeof iconMap]}</span>
            <h4 class="font-bold text-lg" style="color: ${incidentColor}">
              ${incident.type.replace("_", " ").toUpperCase()}
            </h4>
          </div>
          
          <div class="space-y-2">
            <p class="text-gray-700 font-medium">${incident.description}</p>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Severity:</span>
              <span class="font-semibold" style="color: ${
                severity === "critical" ? "#ef4444" : 
                severity === "high" ? "#f59e0b" : "#10b981"
              }">
                ${severity.toUpperCase()}
              </span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Status:</span>
              <span class="font-semibold" style="color: ${
                incident.status === "resolved" ? "#10b981" : "#ef4444"
              }">
                ${incident.status.toUpperCase()}
              </span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Confidence:</span>
              <span class="font-semibold">${Math.round(incident.confidence * 100)}%</span>
            </div>
            
            <div class="text-xs text-gray-500 mt-3 pt-2 border-t">
              Detected: ${new Date(incident._creationTime).toLocaleString()}
            </div>
          </div>
        </div>
      `);
    });

  }, [heatmapData, incidents]);

  if (!isLoaded) {
    return (
      <div className="h-[600px] bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading enhanced heatmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Traffic Heatmap Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-300">Traffic Levels</h4>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm">Low Traffic (0-40%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Medium Traffic (40-70%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm">High Traffic (70-100%)</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-300">Incident Types</h4>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔥</span>
              <span className="text-sm">Fire Incidents</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚗💥</span>
              <span className="text-sm">Accidents</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">👥</span>
              <span className="text-sm">Crowd Detection</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚦</span>
              <span className="text-sm">Traffic Jams</span>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="h-[600px] rounded-lg border border-gray-700"
        style={{ background: "#1f2937" }}
      />
    </div>
  );
}
