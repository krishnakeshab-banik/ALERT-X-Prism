import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Extend Window interface to include Leaflet
declare global {
  interface Window {
    L: any;
  }
}

interface RouteRequest {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  mode: "car" | "bike" | "walk" | "train";
}

export function EnhancedTrafficMap({ showControls = true }: { showControls?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [routeMode, setRouteMode] = useState<"car" | "bike" | "walk" | "train">("car");
  const [routeStart, setRouteStart] = useState<{ lat: number; lng: number } | null>(null);
  const [routeEnd, setRouteEnd] = useState<{ lat: number; lng: number } | null>(null);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  
  const heatmapData = useQuery(api.traffic.getTrafficHeatmapData, {});
  const incidents = useQuery(api.incidents.listIncidents, {});
  // const routes = useQuery(api.traffic.getRoutes, {});

  // Color coding for different incident types
  const incidentColors = {
    fire: "#ff4444",
    accident: "#ff8800", 
    crowd: "#ffaa00",
    unauthorized_movement: "#ff6600",
    traffic_jam: "#ff0000"
  };

  // Traffic intensity colors
  const trafficColors = {
    low: "#10b981",
    medium: "#f59e0b", 
    high: "#ef4444"
  };

  useEffect(() => {
    // Load Leaflet
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

    // Initialize map with better styling
    const map = window.L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true
    });

    // Add custom tile layer with better visibility
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add click handler for route planning
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      
      if (!routeStart) {
        setRouteStart({ lat, lng });
        // Add start marker
        window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            html: '<div style="background: #10b981; color: white; padding: 4px 8px; border-radius: 50%; font-size: 12px; border: 2px solid white;">A</div>',
            className: "custom-route-marker",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })
        }).addTo(map).bindPopup("Start Point");
      } else if (!routeEnd) {
        setRouteEnd({ lat, lng });
        // Add end marker
        window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            html: '<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 50%; font-size: 12px; border: 2px solid white;">B</div>',
            className: "custom-route-marker",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })
        }).addTo(map).bindPopup("End Point");
      }
    });

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

    // Add traffic heatmap with enhanced visualization
    heatmapData.forEach((point) => {
      const color = trafficColors[point.trafficIntensity as keyof typeof trafficColors];
      const radius = point.trafficIntensity === "high" ? 800 : 
                   point.trafficIntensity === "medium" ? 600 : 400;

      const circle = window.L.circle([point.lat, point.lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.4,
        radius: radius,
        weight: 2,
        isHeatmap: true,
      }).addTo(map);

      // Add pulsing animation for high traffic
      if (point.trafficIntensity === "high") {
        const pulsingCircle = window.L.circle([point.lat, point.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          radius: radius * 1.5,
          weight: 1,
          isHeatmap: true,
        }).addTo(map);
      }

      circle.bindPopup(`
        <div class="text-sm min-w-[200px]">
          <h4 class="font-semibold text-lg mb-2">${point.cameraName}</h4>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-600">Traffic Level:</span>
              <span class="font-semibold text-${point.trafficIntensity === 'high' ? 'red' : point.trafficIntensity === 'medium' ? 'yellow' : 'green'}-500">
                ${point.trafficIntensity.toUpperCase()}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Vehicles:</span>
              <span>${point.vehicleCount.cars + point.vehicleCount.bikes + point.vehicleCount.trucks + point.vehicleCount.buses}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">People:</span>
              <span>${point.peopleCount}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Congestion:</span>
              <span>${point.congestionLevel}%</span>
            </div>
            <div class="text-xs text-gray-500 mt-2">
              Updated: ${new Date(point.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      `);
    });

    // Add enhanced incident markers with better color coding
    incidents.forEach((incident) => {
      const iconMap = {
        accident: "🚗💥",
        fire: "🔥",
        crowd: "👥",
        unauthorized_movement: "⚠️",
        traffic_jam: "🚦",
      };

      const color = incidentColors[incident.type as keyof typeof incidentColors];
      const severity = incident.severity;
      const size = severity === "critical" ? 50 : severity === "high" ? 40 : 30;

      const marker = window.L.marker([incident.location.lat, incident.location.lng], {
        icon: window.L.divIcon({
          html: `
            <div style="
              background: ${color}; 
              color: white; 
              padding: 6px 10px; 
              border-radius: 8px; 
              font-size: 16px; 
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              animation: ${severity === "critical" ? "pulse 1s infinite" : "none"};
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

      marker.bindPopup(`
        <div class="text-sm min-w-[250px]">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-2xl">${iconMap[incident.type as keyof typeof iconMap]}</span>
            <h4 class="font-bold text-lg text-${severity === "critical" ? "red" : severity === "high" ? "orange" : "yellow"}-600">
              ${incident.type.replace("_", " ").toUpperCase()}
            </h4>
          </div>
          <div class="space-y-1">
            <p class="text-gray-700">${incident.description}</p>
            <div class="flex justify-between">
              <span class="text-gray-600">Severity:</span>
              <span class="font-semibold text-${severity === "critical" ? "red" : severity === "high" ? "orange" : "yellow"}-600">
                ${severity.toUpperCase()}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Status:</span>
              <span class="font-semibold text-${incident.status === "resolved" ? "green" : "red"}-600">
                ${incident.status.toUpperCase()}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Confidence:</span>
              <span>${Math.round(incident.confidence)}%</span>
            </div>
            <div class="text-xs text-gray-500 mt-2">
              ${new Date(incident._creationTime).toLocaleString()}
            </div>
          </div>
        </div>
      `);
    });
  }, [heatmapData, incidents]);

  const calculateRoute = async () => {
    if (!routeStart || !routeEnd || !mapInstanceRef.current) return;

    setIsRouting(true);
    try {
      const map = mapInstanceRef.current;
      
      // Clear existing route
      if (currentRoute) {
        map.removeLayer(currentRoute);
      }

      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in kilometers
      const dLat = (routeEnd.lat - routeStart.lat) * Math.PI / 180;
      const dLng = (routeEnd.lng - routeStart.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(routeStart.lat * Math.PI / 180) * Math.cos(routeEnd.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // Calculate estimated time based on mode
      let estimatedTime = 0;
      switch (routeMode) {
        case "car":
          estimatedTime = distance / 30; // 30 km/h average
          break;
        case "bike":
          estimatedTime = distance / 15; // 15 km/h average
          break;
        case "walk":
          estimatedTime = distance / 5; // 5 km/h average
          break;
        case "train":
          estimatedTime = distance / 40; // 40 km/h average
          break;
      }

      // Create a simple polyline route
      const routeColor = routeMode === "car" ? "#3b82f6" : 
                        routeMode === "bike" ? "#10b981" :
                        routeMode === "walk" ? "#f59e0b" : "#8b5cf6";

      const polyline = window.L.polyline([routeStart, routeEnd], {
        color: routeColor,
        weight: 6,
        opacity: 0.8
      }).addTo(map);

      setCurrentRoute(polyline);
      
      // Add route info popup
      const routeInfo = `
        <div class="bg-white p-4 rounded-lg shadow-lg">
          <h3 class="font-bold text-lg mb-2">Route Information</h3>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span>Distance:</span>
              <span class="font-semibold">${distance.toFixed(2)} km</span>
            </div>
            <div class="flex justify-between">
              <span>Duration:</span>
              <span class="font-semibold">${Math.round(estimatedTime * 60)} min</span>
            </div>
            <div class="flex justify-between">
              <span>Mode:</span>
              <span class="font-semibold capitalize">${routeMode}</span>
            </div>
          </div>
        </div>
      `;
      
      window.L.popup()
        .setLatLng([routeEnd.lat, routeEnd.lng])
        .setContent(routeInfo)
        .openOn(map);

    } catch (error) {
      console.error("Routing error:", error);
    } finally {
      setIsRouting(false);
    }
  };

  const clearRoute = () => {
    if (currentRoute && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(currentRoute);
      setCurrentRoute(null);
    }
    setRouteStart(null);
    setRouteEnd(null);
  };

  if (!isLoaded) {
    return (
      <div className="h-[600px] bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading enhanced map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showControls && (
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Enhanced Traffic Map</h3>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Low Traffic</span>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium Traffic</span>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>High Traffic</span>
            </div>
          </div>

          {/* Route Planning Controls */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-semibold mb-3">Route Planning</h4>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm">Transport Mode:</label>
                <select
                  value={routeMode}
                  onChange={(e) => setRouteMode(e.target.value as any)}
                  className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                >
                  <option value="car">🚗 Car</option>
                  <option value="bike">🚴 Bike</option>
                  <option value="walk">🚶 Walk</option>
                  <option value="train">🚆 Train</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {routeStart ? "✓ Start point selected" : "Click map for start point"}
                </span>
                {routeEnd && <span className="text-sm">✓ End point selected</span>}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={calculateRoute}
                  disabled={!routeStart || !routeEnd || isRouting}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRouting ? "Calculating..." : "Calculate Route"}
                </button>
                <button
                  onClick={clearRoute}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Clear Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="h-[600px] rounded-lg border border-gray-700"
        style={{ background: "#1f2937" }}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔥</span>
            <span>Fire Incidents</span>
          </div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🚗💥</span>
            <span>Accidents</span>
          </div>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">👥</span>
            <span>Crowd Detection</span>
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
