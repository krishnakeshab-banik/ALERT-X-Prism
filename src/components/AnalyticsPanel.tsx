import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function AnalyticsPanel() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");
  
  const trafficStats = useQuery(api.traffic.getTrafficStats, { timeRange });
  const incidentStats = useQuery(api.incidents.getIncidentStats, {});

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Analytics Dashboard</h3>
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          {[
            { value: "1h", label: "1 Hour" },
            { value: "24h", label: "24 Hours" },
            { value: "7d", label: "7 Days" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                timeRange === option.value
                  ? "bg-cyan-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Traffic Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Vehicles</p>
              <p className="text-2xl font-bold text-cyan-400">{trafficStats?.totalVehicles || 0}</p>
            </div>
            <div className="text-2xl">🚗</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">People Detected</p>
              <p className="text-2xl font-bold text-green-400">{trafficStats?.totalPeople || 0}</p>
            </div>
            <div className="text-2xl">👥</div>
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
              <p className="text-gray-400 text-sm">Data Points</p>
              <p className="text-2xl font-bold text-purple-400">{trafficStats?.dataPoints || 0}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Incident Analytics */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">Incident Overview</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div>
            <h5 className="font-medium mb-3">By Status</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-yellow-400">Pending</span>
                <span className="font-semibold">{incidentStats?.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-400">Resolved</span>
                <span className="font-semibold">{incidentStats?.resolved || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400">Unresolved</span>
                <span className="font-semibold">{incidentStats?.unresolved || 0}</span>
              </div>
            </div>
          </div>

          {/* Type Breakdown */}
          <div>
            <h5 className="font-medium mb-3">By Type</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>🚗💥 Accidents</span>
                <span className="font-semibold">{incidentStats?.byType?.accident || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>🔥 Fire</span>
                <span className="font-semibold">{incidentStats?.byType?.fire || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>👥 Crowd</span>
                <span className="font-semibold">{incidentStats?.byType?.crowd || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>⚠️ Unauthorized</span>
                <span className="font-semibold">{incidentStats?.byType?.unauthorized_movement || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>🚦 Traffic Jam</span>
                <span className="font-semibold">{incidentStats?.byType?.traffic_jam || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Severity Analysis */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">Incident Severity Analysis</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{incidentStats?.bySeverity?.low || 0}</div>
            <div className="text-sm text-gray-400">Low</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{incidentStats?.bySeverity?.medium || 0}</div>
            <div className="text-sm text-gray-400">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{incidentStats?.bySeverity?.high || 0}</div>
            <div className="text-sm text-gray-400">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{incidentStats?.bySeverity?.critical || 0}</div>
            <div className="text-sm text-gray-400">Critical</div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4">System Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Analysis Accuracy</span>
              <span className="font-semibold text-green-400">94.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Response Time</span>
              <span className="font-semibold text-cyan-400">1.2s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Uptime</span>
              <span className="font-semibold text-green-400">99.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">False Positives</span>
              <span className="font-semibold text-yellow-400">5.8%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4">Traffic Insights</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Peak Hours</span>
              <span className="font-semibold">8-10 AM, 6-8 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Busiest Location</span>
              <span className="font-semibold">MG Road Junction</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Speed</span>
              <span className="font-semibold text-cyan-400">25 km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Incident Rate</span>
              <span className="font-semibold text-yellow-400">2.3/hour</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
