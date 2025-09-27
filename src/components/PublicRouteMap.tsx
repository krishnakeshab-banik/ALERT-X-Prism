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
  segments: Array<{
    start: [number, number];
    end: [number, number];
    trafficLevel: "low" | "medium" | "high";
    congestion: number;
  }>;
}

export function PublicRouteMap() {
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
    trafficLevel: "low",
    segments: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [routeLayers, setRouteLayers] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [showTraffic, setShowTraffic] = useState(true);
  
  const incidents = useQuery(api.incidents.listIncidents, {});
  const trafficData = useQuery(api.traffic.getTrafficHeatmapData, {});

  // Extended sample locations for search
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
    { name: "UB City, Bangalore", lat: 12.9716, lng: 77.5946 },
    { name: "Phoenix MarketCity, Bangalore", lat: 12.9165, lng: 77.6224 },
    { name: "Forum Mall, Bangalore", lat: 12.9352, lng: 77.6245 },
    { name: "Orion Mall, Bangalore", lat: 12.9698, lng: 77.7500 },
    { name: "Bangalore Airport", lat: 13.1986, lng: 77.7064 },
    { name: "Bangalore City Railway Station", lat: 12.9767, lng: 77.5928 },
    { name: "Majestic Bus Stand, Bangalore", lat: 12.9767, lng: 77.5928 },
    { name: "Kempegowda Bus Station", lat: 12.9767, lng: 77.5928 },
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
    ).slice(0, 8);
    
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
              padding: 12px 16px; 
              border-radius: 50%; 
              font-size: 18px; 
              font-weight: bold;
              border: 4px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              min-width: 50px;
              text-align: center;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${type === "start" ? "A" : "B"}
            </div>
          `,
          className: "custom-route-marker",
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        })
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div class="text-sm">
          <h4 class="font-bold text-lg">${type === "start" ? "Start" : "End"} Point</h4>
          <p class="text-gray-600">${location.name}</p>
        </div>
      `);

      setMarkers(prev => [...prev, marker]);
    }
  };

  // Calculate route with traffic-aware segments
  const calculateRoute = () => {
    if (!routeData.start || !routeData.end || !mapInstanceRef.current) return;

    // Clear existing route
    clearRoute();

    // Calculate distance and duration
    const distance = calculateDistance(routeData.start, routeData.end);
    const duration = calculateDuration(distance, routeData.mode);
    
    // Create path with multiple waypoints for realistic routing
    const path = createRealisticPath(routeData.start, routeData.end);
    
    // Analyze traffic for each segment
    const segments = analyzeTrafficSegments(path);
    
    // Determine overall traffic level
    const trafficLevel = determineOverallTrafficLevel(segments);
    
    const newRouteData = {
      ...routeData,
      distance,
      duration,
      path,
      trafficLevel,
      segments
    };
    setRouteData(newRouteData);

    // Draw route segments with different colors
    drawTrafficAwareRoute(segments);

    // Fit map to show entire route
    const group = new window.L.featureGroup([...markers, ...routeLayers]);
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
  };

  // Create realistic path with waypoints
  const createRealisticPath = (start: RoutePoint, end: RoutePoint) => {
    const path: [number, number][] = [];
    
    // Add start point
    path.push([start.lat, start.lng]);
    
    // Add intermediate waypoints for realistic routing
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    
    // Add some variation to make it look more realistic
    const waypoint1 = [
      start.lat + (midLat - start.lat) * 0.3 + (Math.random() - 0.5) * 0.01,
      start.lng + (midLng - start.lng) * 0.3 + (Math.random() - 0.5) * 0.01
    ];
    
    const waypoint2 = [
      start.lat + (midLat - start.lat) * 0.7 + (Math.random() - 0.5) * 0.01,
      start.lng + (midLng - start.lng) * 0.7 + (Math.random() - 0.5) * 0.01
    ];
    
    path.push(waypoint1 as [number, number]);
    path.push(waypoint2 as [number, number]);
    
    // Add end point
    path.push([end.lat, end.lng]);
    
    return path;
  };

  // Analyze traffic for each segment
  const analyzeTrafficSegments = (path: [number, number][]) => {
    const segments = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
      
      // Check for incidents and traffic data in this segment
      const segmentTraffic = getSegmentTrafficData(start, end);
      
      segments.push({
        start,
        end,
        trafficLevel: segmentTraffic.level,
        congestion: segmentTraffic.congestion
      });
    }
    
    return segments;
  };

  // Get traffic data for a specific segment
  const getSegmentTrafficData = (start: [number, number], end: [number, number]) => {
    // Check for incidents in this area
    const segmentIncidents = incidents?.filter(incident => {
      const incidentLat = incident.location.lat;
      const incidentLng = incident.location.lng;
      
      // Check if incident is within segment bounds
      const minLat = Math.min(start[0], end[0]);
      const maxLat = Math.max(start[0], end[0]);
      const minLng = Math.min(start[1], end[1]);
      const maxLng = Math.max(start[1], end[1]);
      
      return incidentLat >= minLat && incidentLat <= maxLat &&
             incidentLng >= minLng && incidentLng <= maxLng;
    }) || [];

    // Check traffic data
    const segmentTrafficData = trafficData?.filter(data => {
      const dataLat = data.lat;
      const dataLng = data.lng;
      
      const minLat = Math.min(start[0], end[0]);
      const maxLat = Math.max(start[0], end[0]);
      const minLng = Math.min(start[1], end[1]);
      const maxLng = Math.max(start[1], end[1]);
      
      return dataLat >= minLat && dataLat <= maxLat &&
             dataLng >= minLng && dataLng <= maxLng;
    }) || [];

    // Calculate congestion level
    const avgCongestion = segmentTrafficData.length > 0 
      ? segmentTrafficData.reduce((sum, data) => sum + data.intensity, 0) / segmentTrafficData.length
      : 0.3;

    // Determine traffic level
    let level: "low" | "medium" | "high" = "low";
    if (segmentIncidents.length > 1 || avgCongestion > 0.7) {
      level = "high";
    } else if (segmentIncidents.length > 0 || avgCongestion > 0.4) {
      level = "medium";
    }

    return {
      level,
      congestion: avgCongestion
    };
  };

  // Draw traffic-aware route with Uber-style colors
  const drawTrafficAwareRoute = (segments: any[]) => {
    const layers: any[] = [];
    
    segments.forEach((segment, index) => {
      const color = getTrafficColor(segment.trafficLevel);
      const weight = segment.trafficLevel === "high" ? 8 : segment.trafficLevel === "medium" ? 6 : 4;
      
      const polyline = window.L.polyline([segment.start, segment.end], {
        color: color,
        weight: weight,
        opacity: 0.8,
        dashArray: segment.trafficLevel === "high" ? "10, 5" : "5, 5"
      }).addTo(mapInstanceRef.current);

      // Add traffic indicator
      const midLat = (segment.start[0] + segment.end[0]) / 2;
      const midLng = (segment.start[1] + segment.end[1]) / 2;
      
      const trafficIcon = window.L.marker([midLat, midLng], {
        icon: window.L.divIcon({
          html: `
            <div style="
              background: ${color}; 
              color: white; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 12px; 
              font-weight: bold;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              min-width: 30px;
              text-align: center;
            ">
              ${Math.round(segment.congestion * 100)}%
            </div>
          `,
          className: "traffic-indicator",
          iconSize: [30, 20],
          iconAnchor: [15, 10],
        })
      }).addTo(mapInstanceRef.current);

      layers.push(polyline, trafficIcon);
    });
    
    setRouteLayers(layers);
  };

  // Get traffic color (Uber-style)
  const getTrafficColor = (trafficLevel: string) => {
    switch (trafficLevel) {
      case "high": return "#ff4444"; // Red
      case "medium": return "#ff8800"; // Orange
      case "low": return "#00aa44"; // Green
      default: return "#666666"; // Gray
    }
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

  // Calculate duration based on mode and traffic
  const calculateDuration = (distance: number, mode: string) => {
    const baseSpeeds = {
      car: 30,
      bike: 15,
      walk: 5,
      train: 40
    };
    
    const baseSpeed = baseSpeeds[mode as keyof typeof baseSpeeds];
    const trafficFactor = routeData.trafficLevel === "high" ? 0.5 : 
                         routeData.trafficLevel === "medium" ? 0.7 : 1.0;
    
    const actualSpeed = baseSpeed * trafficFactor;
    return (distance / actualSpeed) * 60; // in minutes
  };

  // Determine overall traffic level
  const determineOverallTrafficLevel = (segments: any[]) => {
    const highTrafficSegments = segments.filter(s => s.trafficLevel === "high").length;
    const mediumTrafficSegments = segments.filter(s => s.trafficLevel === "medium").length;
    
    if (highTrafficSegments > segments.length * 0.3) return "high";
    if (mediumTrafficSegments > segments.length * 0.3) return "medium";
    return "low";
  };

  // Clear route
  const clearRoute = () => {
    routeLayers.forEach(layer => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    setRouteLayers([]);
    
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
      trafficLevel: "low",
      segments: []
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
          <p className="text-gray-400">Loading route planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Route Controls */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Route Planner</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showTraffic}
                onChange={(e) => setShowTraffic(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-300">Show Traffic</span>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Start Location */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
              <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">A</span>
              <span>From</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search start location..."
                value={routeData.start ? routeData.start.address : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
                onFocus={() => {
                  if (routeData.start) {
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => selectLocation(result, "start")}
                      className="px-4 py-3 hover:bg-gray-600 cursor-pointer text-sm border-b border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-white">{result.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* End Location */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
              <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">B</span>
              <span>To</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search destination..."
                value={routeData.end ? routeData.end.address : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
                onFocus={() => {
                  if (routeData.end) {
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => selectLocation(result, "end")}
                      className="px-4 py-3 hover:bg-gray-600 cursor-pointer text-sm border-b border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium text-white">{result.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transport Mode */}
        <div className="flex items-center space-x-6 mb-6">
          <label className="text-sm font-medium text-gray-300">Transport Mode:</label>
          {[
            { mode: "car", icon: "🚗", label: "Car" },
            { mode: "bike", icon: "🚴", label: "Bike" },
            { mode: "walk", icon: "🚶", label: "Walk" },
            { mode: "train", icon: "🚆", label: "Train" }
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setRouteData(prev => ({ ...prev, mode: mode as any }))}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                routeData.mode === mode
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Route Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={calculateRoute}
            disabled={!routeData.start || !routeData.end}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Plan Route
          </button>
          <button
            onClick={clearRoute}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Clear Route
          </button>
        </div>

        {/* Route Information */}
        {routeData.distance > 0 && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-lg font-semibold mb-4 text-white">Route Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{routeData.distance.toFixed(1)} km</div>
                <div className="text-gray-400">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{Math.round(routeData.duration)} min</div>
                <div className="text-gray-400">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 capitalize">{routeData.mode}</div>
                <div className="text-gray-400">Mode</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  routeData.trafficLevel === "high" ? "text-red-400" :
                  routeData.trafficLevel === "medium" ? "text-yellow-400" : "text-green-400"
                }`}>
                  {routeData.trafficLevel.toUpperCase()}
                </div>
                <div className="text-gray-400">Traffic</div>
              </div>
            </div>
            
            {/* Traffic Legend */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex items-center justify-center space-x-6 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-green-500 rounded"></div>
                  <span className="text-gray-300">Low Traffic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-orange-500 rounded"></div>
                  <span className="text-gray-300">Medium Traffic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-red-500 rounded"></div>
                  <span className="text-gray-300">High Traffic</span>
                </div>
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
