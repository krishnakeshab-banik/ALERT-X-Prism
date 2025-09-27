import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function RoutePanel() {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [selectedMode, setSelectedMode] = useState<"car" | "bike" | "walk" | "train">("car");
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);

  const calculateRoute = useMutation(api.routes.calculateRoute);
  const routeAlternatives = useQuery(
    api.routes.getRouteAlternatives,
    currentRoute ? {
      startLocation: currentRoute.startLocation,
      endLocation: currentRoute.endLocation,
    } : "skip"
  );

  const handleCalculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startLocation || !endLocation) return;

    setIsCalculating(true);
    try {
      // For demo purposes, use fixed coordinates for Bangalore locations
      const startCoords = getLocationCoords(startLocation);
      const endCoords = getLocationCoords(endLocation);

      const route = await calculateRoute({
        startLocation: startCoords,
        endLocation: endCoords,
        mode: selectedMode,
      });

      setCurrentRoute(route);
      toast.success("Route calculated successfully!");
    } catch (error) {
      toast.error("Failed to calculate route");
      console.error(error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getLocationCoords = (location: string) => {
    // Demo coordinates for common Bangalore locations
    const locations: Record<string, { lat: number; lng: number }> = {
      "mg road": { lat: 12.9716, lng: 77.5946 },
      "koramangala": { lat: 12.9352, lng: 77.6245 },
      "whitefield": { lat: 12.9698, lng: 77.7500 },
      "electronic city": { lat: 12.8456, lng: 77.6603 },
      "silk board": { lat: 12.9165, lng: 77.6224 },
      "indiranagar": { lat: 12.9719, lng: 77.6412 },
      "jayanagar": { lat: 12.9279, lng: 77.5937 },
      "btm layout": { lat: 12.9166, lng: 77.6101 },
    };

    const key = location.toLowerCase();
    return locations[key] || { lat: 12.9716, lng: 77.5946 };
  };

  const getModeIcon = (mode: string) => {
    const icons = {
      car: "🚗",
      bike: "🚲",
      walk: "🚶",
      train: "🚊",
    };
    return icons[mode as keyof typeof icons] || "🚗";
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Route Calculator */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Route Planner</h3>
        
        <form onSubmit={handleCalculateRoute} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">From</label>
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Enter starting location"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Try: MG Road, Koramangala, Whitefield, Electronic City
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <input
                type="text"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                placeholder="Enter destination"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Travel Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {(["car", "bike", "walk", "train"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedMode === mode
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                      : "border-gray-600 bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  <div className="text-2xl mb-1">{getModeIcon(mode)}</div>
                  <div className="text-xs capitalize">{mode}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isCalculating || !startLocation || !endLocation}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? "Calculating Route..." : "Calculate Route"}
          </button>
        </form>
      </div>

      {/* Current Route */}
      {currentRoute && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4">Recommended Route</h4>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-3xl">{getModeIcon(currentRoute.mode)}</div>
            <div>
              <p className="font-semibold">
                {formatTime(currentRoute.estimatedTime)} • {currentRoute.distance.toFixed(1)} km
              </p>
              {currentRoute.trafficDelay > 0 && (
                <p className="text-sm text-yellow-400">
                  +{formatTime(currentRoute.trafficDelay)} traffic delay
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Start: {startLocation}</span>
            </div>
            <div className="ml-6 my-2 border-l-2 border-gray-600 h-8"></div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>End: {endLocation}</span>
            </div>
          </div>
        </div>
      )}

      {/* Route Alternatives */}
      {routeAlternatives && routeAlternatives.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4">Alternative Routes</h4>
          
          <div className="space-y-3">
            {routeAlternatives.map((route, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">{getModeIcon(route.mode)}</div>
                  <div>
                    <p className="font-medium capitalize">{route.mode}</p>
                    <p className="text-sm text-gray-400">
                      {formatTime(route.estimatedTime)} • {route.distance.toFixed(1)} km
                    </p>
                  </div>
                </div>
                
                {route.trafficDelay > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-yellow-400">
                      +{formatTime(route.trafficDelay)} delay
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traffic Tips */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">Traffic Tips</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <span>🚦</span>
            <span>Avoid peak hours (8-10 AM, 6-8 PM) for faster travel</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🚲</span>
            <span>Consider cycling for short distances to avoid traffic</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🚊</span>
            <span>Metro is often faster during rush hours</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📱</span>
            <span>Check live traffic updates before starting your journey</span>
          </div>
        </div>
      </div>
    </div>
  );
}
