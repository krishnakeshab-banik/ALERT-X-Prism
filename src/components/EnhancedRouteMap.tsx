import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Extend Window interface to include Leaflet
declare global {
  interface Window {
    L: any;
  }
}

interface RoutePoint {
  lat: number;
  lng: number;
  address: string;
}

interface RouteData {
  start: RoutePoint | null;
  end: RoutePoint | null;
  mode: "car" | "bike" | "walk" | "train";
  distance: number;
  duration: number;
  path: [number, number][];
  trafficLevel: "low" | "medium" | "high";
}

export function EnhancedRouteMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [routeData, setRouteData] = useState<RouteData>({
    start: null,
    end: null,
    mode: "car",
    distance: 0,
    duration: 0,
    path: [],
    trafficLevel: "low"
  });
  const [isSearching, setIsSearching] = useState(false);
  const [routeLayer, setRouteLayer] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  
  const incidents = useQuery(api.incidents.listIncidents, {});
  const trafficData = useQuery(api.traffic.getTrafficHeatmapData, {});

  // Sample locations for search
  const sampleLocations = [
    { name: "MG Road, Bangalore", lat: 12.9716, lng: 77.5946 },
    { name: "Silk Board, Bangalore", lat: 12.9165, lng: 77.6224 },
    { name: "Electronic City, Bangalore", lat: 12.8456, lng: 77.6603 },
    { name: "Koramangala, Bangalore", lat: 12.9352, lng: 77.6245 },
    { name: "Whitefield, Bangalore", lat: 12.9698, lng: 77.7500 },
    { name: "Indiranagar, Bangalore", lat: 12.9719, lng: 77.6412 },
    { name: "Jayanagar, Bangalore", lat: 12.9249, lng: 77.5833 },
    { name: "Marathahalli, Bangalore", lat: 12.9589, lng: 77.7014 },
    { name: "Cubbon Park, Bangalore", lat: 12.9767, lng: 77.5928 },
    { name: "Lalbagh, Bangalore", lat: 12.9507, lng: 77.5848 },
    { name: "Vidhana Soudha, Bangalore", lat: 12.9791, lng: 77.5903 },
    { name: "Bangalore Palace, Bangalore", lat: 12.9977, lng: 77.5921 },
  ];

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

  // Handle search
  const handleSearch = (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = sampleLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    setSearchResults(results);
    setIsSearching(false);
  };

  // Select location
  const selectLocation = (location: any, type: "start" | "end") => {
    const newRouteData = { ...routeData };
    newRouteData[type] = {
      lat: location.lat,
      lng: location.lng,
      address: location.name
    };
    setRouteData(newRouteData);
    setSearchQuery("");
    setSearchResults([]);

    // Add marker to map
    if (mapInstanceRef.current) {
      const marker = window.L.marker([location.lat, location.lng], {
        icon: window.L.divIcon({
          html: `
            <div style="
              background: ${type === "start" ? "#10b981" : "#ef4444"}; 
              color: white; 
              padding: 8px 12px; 
              border-radius: 50%; 
              font-size: 16px; 
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              min-width: 40px;
              text-align: center;
            ">
              ${type === "start" ? "A" : "B"}
            </div>
          `,
          className: "custom-route-marker",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div class="text-sm">
          <h4 class="font-bold">${type === "start" ? "Start" : "End"} Point</h4>
          <p class="text-gray-600">${location.name}</p>
        </div>
      `);

      setMarkers(prev => [...prev, marker]);
    }
  };

  // Calculate route
  const calculateRoute = () => {
    if (!routeData.start || !routeData.end || !mapInstanceRef.current) return;

    // Clear existing route
    if (routeLayer) {
      mapInstanceRef.current.removeLayer(routeLayer);
    }

    // Calculate distance and duration using Haversine formula
    const distance = calculateDistance(routeData.start, routeData.end);
    const duration = calculateDuration(distance, routeData.mode);
    
    // Determine traffic level based on incidents and traffic data
    const trafficLevel = determineTrafficLevel(routeData.start, routeData.end);
    
    // Create path (simplified - in real app, use routing service)
    const path: [number, number][] = [
      [routeData.start.lat, routeData.start.lng],
      [routeData.end.lat, routeData.end.lng]
    ];

    const newRouteData = {
      ...routeData,
      distance,
      duration,
      path,
      trafficLevel
    };
    setRouteData(newRouteData);

    // Draw route on map
    const routeColor = getRouteColor(trafficLevel);
    const route = window.L.polyline(path, {
      color: routeColor,
      weight: 6,
      opacity: 0.8,
      dashArray: "10, 10"
    }).addTo(mapInstanceRef.current);

    setRouteLayer(route);

    // Fit map to show entire route
    const group = new window.L.featureGroup([...markers, route]);
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (start: RoutePoint, end: RoutePoint) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLng = (end.lng - start.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate duration based on mode
  const calculateDuration = (distance: number, mode: string) => {
    const speeds = {
      car: 30,
      bike: 15,
      walk: 5,
      train: 40
    };
    return (distance / speeds[mode as keyof typeof speeds]) * 60; // in minutes
  };

  // Determine traffic level
  const determineTrafficLevel = (start: RoutePoint, end: RoutePoint) => {
    // Check for incidents along the route
    const routeIncidents = incidents?.filter(incident => {
      const incidentLat = incident.location.lat;
      const incidentLng = incident.location.lng;
      
      // Simple check if incident is roughly on the route
      const minLat = Math.min(start.lat, end.lat);
      const maxLat = Math.max(start.lat, end.lat);
      const minLng = Math.min(start.lng, end.lng);
      const maxLng = Math.max(start.lng, end.lng);
      
      return incidentLat >= minLat && incidentLat <= maxLat &&
             incidentLng >= minLng && incidentLng <= maxLng;
    }) || [];

    if (routeIncidents.length > 2) return "high";
    if (routeIncidents.length > 0) return "medium";
    return "low";
  };

  // Get route color based on traffic level
  const getRouteColor = (trafficLevel: string) => {
    switch (trafficLevel) {
      case "high": return "#ef4444"; // Red
      case "medium": return "#f59e0b"; // Orange
      case "low": return "#10b981"; // Green
      default: return "#6b7280"; // Gray
    }
  };

  // Clear route
  const clearRoute = () => {
    if (routeLayer && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLayer);
      setRouteLayer(null);
    }
    
    // Remove markers
    markers.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    setMarkers([]);
    
    setRouteData({
      start: null,
      end: null,
      mode: "car",
      distance: 0,
      duration: 0,
      path: [],
      trafficLevel: "low"
    });
  };

  // Render incidents on map
  useEffect(() => {
    if (!mapInstanceRef.current || !incidents) return;

    // Clear existing incident markers
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer.options && layer.options.isIncident) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add incident markers
    incidents.forEach((incident) => {
      const incidentColor = getIncidentColor(incident.type);
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
              min-width: 50px;
              text-align: center;
            ">
              ${iconMap[incident.type as keyof typeof iconMap]}
            </div>
          `,
          className: "custom-incident-marker",
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        }),
        isIncident: true,
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div class="text-sm min-w-[280px]">
          <div class="flex items-center space-x-2 mb-3">
            <span class="text-2xl">${iconMap[incident.type as keyof typeof iconMap]}</span>
            <h4 class="font-bold text-lg" style="color: ${incidentColor}">
              ${incident.type.replace("_", " ").toUpperCase()}
            </h4>
          </div>
          <p class="text-gray-700 font-medium">${incident.description}</p>
          <div class="flex justify-between mt-2">
            <span class="text-gray-600">Severity:</span>
            <span class="font-semibold" style="color: ${
              incident.severity === "critical" ? "#ef4444" : 
              incident.severity === "high" ? "#f59e0b" : "#10b981"
            }">
              ${incident.severity.toUpperCase()}
            </span>
          </div>
        </div>
      `);
    });
  }, [incidents]);

  const getIncidentColor = (type: string) => {
    switch (type) {
      case "fire": return "#ff4444";
      case "accident": return "#ff8800";
      case "crowd": return "#ffaa00";
      case "traffic_jam": return "#ff0000";
      case "unauthorized_movement": return "#ff6600";
      default: return "#6b7280";
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-[600px] bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading route map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Route Controls */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Route Planner</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Start Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">From</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search start location..."
                value={routeData.start ? routeData.start.address : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                onFocus={() => {
                  if (routeData.start) {
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => selectLocation(result, "start")}
                      className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-sm"
                    >
                      {result.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* End Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">To</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search destination..."
                value={routeData.end ? routeData.end.address : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                onFocus={() => {
                  if (routeData.end) {
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => selectLocation(result, "end")}
                      className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-sm"
                    >
                      {result.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transport Mode */}
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-medium text-gray-300">Mode:</label>
          {["car", "bike", "walk", "train"].map((mode) => (
            <button
              key={mode}
              onClick={() => setRouteData(prev => ({ ...prev, mode: mode as any }))}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                routeData.mode === mode
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {mode === "car" ? "🚗 Car" :
               mode === "bike" ? "🚴 Bike" :
               mode === "walk" ? "🚶 Walk" : "🚆 Train"}
            </button>
          ))}
        </div>

        {/* Route Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={calculateRoute}
            disabled={!routeData.start || !routeData.end}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Calculate Route
          </button>
          <button
            onClick={clearRoute}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear Route
          </button>
        </div>

        {/* Route Information */}
        {routeData.distance > 0 && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Distance:</span>
                <span className="ml-2 font-semibold">{routeData.distance.toFixed(1)} km</span>
              </div>
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="ml-2 font-semibold">{Math.round(routeData.duration)} min</span>
              </div>
              <div>
                <span className="text-gray-400">Mode:</span>
                <span className="ml-2 font-semibold capitalize">{routeData.mode}</span>
              </div>
              <div>
                <span className="text-gray-400">Traffic:</span>
                <span className={`ml-2 font-semibold ${
                  routeData.trafficLevel === "high" ? "text-red-400" :
                  routeData.trafficLevel === "medium" ? "text-yellow-400" : "text-green-400"
                }`}>
                  {routeData.trafficLevel.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div 
        ref={mapRef} 
        className="h-[600px] rounded-lg border border-gray-700"
        style={{ background: "#1f2937" }}
      />
    </div>
  );
}
