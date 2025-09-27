import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { EnhancedTrafficMap } from "./EnhancedTrafficMap";
import { EnhancedRouteMap } from "./EnhancedRouteMap";
import { PublicRouteMap } from "./PublicRouteMap";

export function PublicDashboard() {
  const [activeTab, setActiveTab] = useState<"map" | "routes">("map");
  const trafficStats = useQuery(api.traffic.getTrafficStats, {});
  const incidents = useQuery(api.incidents.listIncidents, { status: "pending" });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Live Traffic Monitoring</h2>
        <p className="text-gray-400">Real-time traffic data powered by AI camera analysis</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Current Traffic</p>
              <p className="text-xl font-bold text-cyan-400">
                {trafficStats?.avgCongestion ? 
                  trafficStats.avgCongestion > 70 ? "Heavy" :
                  trafficStats.avgCongestion > 40 ? "Moderate" : "Light"
                  : "Loading..."
                }
              </p>
            </div>
            <div className="text-2xl">🚦</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Incidents</p>
              <p className="text-xl font-bold text-red-400">{incidents?.length || 0}</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Vehicles Detected</p>
              <p className="text-xl font-bold text-green-400">{trafficStats?.totalVehicles || 0}</p>
            </div>
            <div className="text-2xl">🚗</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
            activeTab === "map"
              ? "bg-cyan-500 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <span>🗺️</span>
          <span>Traffic Map</span>
        </button>
        <button
          onClick={() => setActiveTab("routes")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
            activeTab === "routes"
              ? "bg-cyan-500 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <span>🛣️</span>
          <span>Route Planning</span>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === "map" && <EnhancedTrafficMap showControls={false} />}
        {activeTab === "routes" && <PublicRouteMap />}
      </div>
    </div>
  );
}
