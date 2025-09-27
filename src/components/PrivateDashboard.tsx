import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CameraGrid } from "./CameraGrid";
import { toast } from "sonner";

export function PrivateDashboard() {
  const [activeTab, setActiveTab] = useState<"cameras" | "alerts" | "settings">("cameras");
  const [showAddCamera, setShowAddCamera] = useState(false);
  
  const cameras = useQuery(api.cameras.listCameras, { type: "private" });
  const incidents = useQuery(api.incidents.listIncidents, { type: "unauthorized_movement" });
  const addCamera = useMutation(api.cameras.addCamera);

  const [newCamera, setNewCamera] = useState({
    name: "",
    address: "",
    lat: 12.9716,
    lng: 77.5946,
    startTime: "09:00",
    endTime: "18:00",
  });

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCamera({
        name: newCamera.name,
        location: {
          lat: newCamera.lat,
          lng: newCamera.lng,
          address: newCamera.address,
        },
        type: "private",
        operationalHours: {
          start: newCamera.startTime,
          end: newCamera.endTime,
        },
      });
      
      toast.success("Camera added successfully!");
      setShowAddCamera(false);
      setNewCamera({
        name: "",
        address: "",
        lat: 12.9716,
        lng: 77.5946,
        startTime: "09:00",
        endTime: "18:00",
      });
    } catch (error) {
      toast.error("Failed to add camera");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Private Security Dashboard</h2>
          <p className="text-gray-400">Manage your cameras and security alerts</p>
        </div>
        <button
          onClick={() => setShowAddCamera(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
        >
          + Add Camera
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your Cameras</p>
              <p className="text-2xl font-bold text-cyan-400">{cameras?.length || 0}</p>
            </div>
            <div className="text-2xl">📹</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Security Alerts</p>
              <p className="text-2xl font-bold text-red-400">{incidents?.length || 0}</p>
            </div>
            <div className="text-2xl">🚨</div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Monitoring</p>
              <p className="text-2xl font-bold text-green-400">{cameras?.filter(c => c.status === "active").length || 0}</p>
            </div>
            <div className="text-2xl">👁️</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { id: "cameras" as const, label: "Cameras", icon: "📹" },
          { id: "alerts" as const, label: "Security Alerts", icon: "🚨", badge: incidents?.length },
          { id: "settings" as const, label: "Settings", icon: "⚙️" },
        ].map((tab) => (
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

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === "cameras" && <CameraGrid privateOnly={true} />}
        {activeTab === "alerts" && <SecurityAlerts incidents={incidents} />}
        {activeTab === "settings" && <PrivateSettings />}
      </div>

      {/* Add Camera Modal */}
      {showAddCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Camera</h3>
            <form onSubmit={handleAddCamera} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Camera Name</label>
                <input
                  type="text"
                  value={newCamera.name}
                  onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={newCamera.address}
                  onChange={(e) => setNewCamera({ ...newCamera, address: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newCamera.lat}
                    onChange={(e) => setNewCamera({ ...newCamera, lat: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newCamera.lng}
                    onChange={(e) => setNewCamera({ ...newCamera, lng: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newCamera.startTime}
                    onChange={(e) => setNewCamera({ ...newCamera, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={newCamera.endTime}
                    onChange={(e) => setNewCamera({ ...newCamera, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCamera(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  Add Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityAlerts({ incidents }: { incidents: any[] | undefined }) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛡️</div>
        <h3 className="text-xl font-semibold mb-2">No Security Alerts</h3>
        <p className="text-gray-400">Your premises are secure. All cameras are monitoring normally.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <div key={incident._id} className="bg-gray-800 p-4 rounded-lg border border-red-500/30">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🚨</div>
              <div>
                <h4 className="font-semibold text-red-400">Unauthorized Movement Detected</h4>
                <p className="text-gray-300 text-sm">{incident.description}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {incident.camera?.name} • {new Date(incident._creationTime).toLocaleString()}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              incident.severity === "critical" ? "bg-red-500/20 text-red-400" :
              incident.severity === "high" ? "bg-orange-500/20 text-orange-400" :
              "bg-yellow-500/20 text-yellow-400"
            }`}>
              {incident.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PrivateSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span>Email alerts for unauthorized movement</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span>SMS alerts for critical incidents</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" />
            <span>Daily security reports</span>
          </label>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Emergency Contacts</h3>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Emergency contact email"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
          />
          <input
            type="tel"
            placeholder="Emergency contact phone"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
