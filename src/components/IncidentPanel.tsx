import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function IncidentPanel() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved" | "unresolved">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "accident" | "fire" | "crowd" | "unauthorized_movement" | "traffic_jam">("all");
  
  const incidents = useQuery(api.incidents.listIncidents, {
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
  });
  
  const updateIncidentStatus = useMutation(api.incidents.updateIncidentStatus);

  const handleStatusUpdate = async (incidentId: string, status: "pending" | "resolved" | "unresolved") => {
    try {
      await updateIncidentStatus({ incidentId: incidentId as any, status });
      toast.success(`Incident marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update incident status");
    }
  };

  const getIncidentIcon = (type: string) => {
    const icons = {
      accident: "🚗💥",
      fire: "🔥",
      crowd: "👥",
      unauthorized_movement: "⚠️",
      traffic_jam: "🚦",
    };
    return icons[type as keyof typeof icons] || "❓";
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "text-green-400 bg-green-400/10",
      medium: "text-yellow-400 bg-yellow-400/10",
      high: "text-orange-400 bg-orange-400/10",
      critical: "text-red-400 bg-red-400/10",
    };
    return colors[severity as keyof typeof colors] || "text-gray-400 bg-gray-400/10";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "text-yellow-400 bg-yellow-400/10",
      resolved: "text-green-400 bg-green-400/10",
      unresolved: "text-red-400 bg-red-400/10",
    };
    return colors[status as keyof typeof colors] || "text-gray-400 bg-gray-400/10";
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
            >
              <option value="all">All Types</option>
              <option value="accident">Accidents</option>
              <option value="fire">Fire</option>
              <option value="crowd">Crowd</option>
              <option value="unauthorized_movement">Unauthorized Movement</option>
              <option value="traffic_jam">Traffic Jam</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {!incidents || incidents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">No Incidents Found</h3>
            <p className="text-gray-400">All systems are running smoothly.</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div key={incident._id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{getIncidentIcon(incident.type)}</div>
                  <div>
                    <h4 className="text-lg font-semibold capitalize">
                      {incident.type.replace("_", " ")}
                    </h4>
                    <p className="text-gray-300">{incident.description}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      📍 {incident.location.address}
                    </p>
                    <p className="text-sm text-gray-400">
                      📹 {incident.camera?.name} • {new Date(incident._creationTime).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
              </div>
              
              {incident.status === "pending" && (
                <div className="flex space-x-2 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleStatusUpdate(incident._id, "resolved")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(incident._id, "unresolved")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Mark Unresolved
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
