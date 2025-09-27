import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TrafficMap } from "./TrafficMap";
import { EnhancedTrafficMap } from "./EnhancedTrafficMap";
import { EnhancedHeatmap } from "./EnhancedHeatmap";
import { EnhancedRouteMap } from "./EnhancedRouteMap";
import { IncidentPanel } from "./IncidentPanel";
import { CameraGrid } from "./CameraGrid";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { CameraFeed } from "./CameraFeed";

export function GovernmentDashboard() {
  const [activeTab, setActiveTab] = useState<"map" | "heatmap" | "routes" | "incidents" | "cameras" | "analytics" | "live-feed">("map");
  const incidents = useQuery(api.incidents.listIncidents, {});
  const cameras = useQuery(api.cameras.listCameras, {});
  const trafficStats = useQuery(api.traffic.getTrafficStats, {});

  const tabs = [
    { id: "map" as const, label: "Live Map", icon: "🗺️" },
    { id: "heatmap" as const, label: "Heatmap", icon: "🔥" },
    { id: "routes" as const, label: "Routes", icon: "🛣️" },
    { id: "live-feed" as const, label: "Live Feed", icon: "📹" },
    { id: "incidents" as const, label: "Incidents", icon: "🚨", badge: incidents?.filter(i => i.status === "pending").length },
    { id: "cameras" as const, label: "Cameras", icon: "📹", badge: cameras?.filter(c => c.status === "active").length },
    { id: "analytics" as const, label: "Analytics", icon: "📊" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Cameras</p>
              <p className="text-2xl font-bold text-cyan-400">{cameras?.filter(c => c.status === "active").length || 0}</p>
            </div>
            <div className="text-2xl">📹</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Incidents</p>
              <p className="text-2xl font-bold text-red-400">{incidents?.filter(i => i.status === "pending").length || 0}</p>
            </div>
            <div className="text-2xl">🚨</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Congestion</p>
              <p className="text-2xl font-bold text-yellow-400">{trafficStats?.avgCongestion || 0}%</p>
            </div>
            <div className="text-2xl">🚦</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Vehicles</p>
              <p className="text-2xl font-bold text-green-400">{trafficStats?.totalVehicles || 0}</p>
            </div>
            <div className="text-2xl">🚗</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all relative ${
              activeTab === tab.id
                ? "bg-cyan-500 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "map" && <EnhancedTrafficMap />}
        {activeTab === "heatmap" && <EnhancedHeatmap />}
        {activeTab === "routes" && <EnhancedRouteMap />}
        {activeTab === "live-feed" && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Live Camera Feed with AI Analysis</h3>
              <CameraFeed 
                cameraId="laptop-camera"
                onIncidentDetected={(incident) => {
                  console.log("Incident detected:", incident);
                }}
                isActive={true}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Real-time Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>AI Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Detection Rate:</span>
                    <span>95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Analysis:</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Incident Types Detected</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span>🔥</span>
                    <span>Fire Detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🚗💥</span>
                    <span>Accident Detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>👥</span>
                    <span>Crowd Detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>Unauthorized Movement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "incidents" && <IncidentPanel />}
        {activeTab === "cameras" && <CameraGrid />}
        {activeTab === "analytics" && <AnalyticsPanel />}
      </div>
    </div>
  );
}
