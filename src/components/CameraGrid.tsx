import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function CameraGrid({ privateOnly = false }: { privateOnly?: boolean }) {
  const cameras = useQuery(api.cameras.listCameras, { 
    type: privateOnly ? "private" : undefined 
  });
  const updateCameraStatus = useMutation(api.cameras.updateCameraStatus);

  const handleStatusChange = async (cameraId: string, status: "active" | "inactive" | "maintenance") => {
    try {
      await updateCameraStatus({ cameraId: cameraId as any, status });
      toast.success(`Camera status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update camera status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "text-green-400 bg-green-400/10",
      inactive: "text-red-400 bg-red-400/10",
      maintenance: "text-yellow-400 bg-yellow-400/10",
    };
    return colors[status as keyof typeof colors] || "text-gray-400 bg-gray-400/10";
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      active: "🟢",
      inactive: "🔴",
      maintenance: "🟡",
    };
    return icons[status as keyof typeof icons] || "⚪";
  };

  if (!cameras || cameras.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📹</div>
        <h3 className="text-xl font-semibold mb-2">No Cameras Found</h3>
        <p className="text-gray-400">
          {privateOnly ? "Add your first camera to start monitoring." : "No cameras are currently registered."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          {privateOnly ? "Your Cameras" : "All Cameras"} ({cameras.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <div key={camera._id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {/* Camera Feed Placeholder */}
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              <div className="text-center">
                <div className="text-4xl mb-2">📹</div>
                <p className="text-sm text-gray-400">Live Feed</p>
              </div>
              
              {/* Status Indicator */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(camera.status)}`}>
                  {getStatusIcon(camera.status)} {camera.status}
                </span>
              </div>
            </div>

            {/* Camera Info */}
            <div className="p-4">
              <h4 className="font-semibold mb-2">{camera.name}</h4>
              <p className="text-sm text-gray-400 mb-3">📍 {camera.location.address}</p>
              
              {camera.operationalHours && (
                <p className="text-sm text-gray-400 mb-3">
                  🕒 {camera.operationalHours.start} - {camera.operationalHours.end}
                </p>
              )}

              {camera.lastAnalysis && (
                <p className="text-xs text-gray-500 mb-3">
                  Last analyzed: {new Date(camera.lastAnalysis).toLocaleString()}
                </p>
              )}

              {/* Status Controls */}
              <div className="flex space-x-2">
                <select
                  value={camera.status}
                  onChange={(e) => handleStatusChange(camera._id, e.target.value as any)}
                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:border-cyan-400 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
