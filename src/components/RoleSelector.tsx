import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function RoleSelector() {
  const [selectedRole, setSelectedRole] = useState<"government" | "public" | "private" | null>(null);
  const [organization, setOrganization] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const createProfile = useMutation(api.users.createUserProfile);
  const initializeCameras = useMutation(api.cameras.initializeDemoCameras);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      await createProfile({
        role: selectedRole,
        organization: organization || undefined,
      });

      // Initialize demo cameras for government users
      if (selectedRole === "government") {
        await initializeCameras();
      }

      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: "government" as const,
      title: "Government",
      description: "Access to all cameras, incident management, and analytics",
      icon: "🏛️",
      features: ["Live Camera Monitoring", "Incident Management", "Traffic Analytics", "Emergency Response"],
    },
    {
      id: "public" as const,
      title: "Public",
      description: "View traffic conditions and get route suggestions",
      icon: "👥",
      features: ["Traffic Map", "Route Planning", "Incident Alerts", "Real-time Updates"],
    },
    {
      id: "private" as const,
      title: "Private",
      description: "Manage your own cameras and receive security alerts",
      icon: "🏢",
      features: ["Camera Management", "Security Alerts", "Operational Hours", "Unauthorized Access Detection"],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose Your Role</h2>
        <p className="text-gray-400">Select your role to access the appropriate dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedRole === role.id
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{role.icon}</div>
                <h3 className="text-xl font-semibold">{role.title}</h3>
                <p className="text-gray-400 text-sm mt-2">{role.description}</p>
              </div>
              
              <div className="space-y-2">
                {role.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {(selectedRole === "government" || selectedRole === "private") && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Organization {selectedRole === "private" ? "(Required)" : "(Optional)"}
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Enter your organization name"
              required={selectedRole === "private"}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
          </div>
        )}

        <div className="text-center">
          <button
            type="submit"
            disabled={!selectedRole || isLoading}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Profile..." : "Continue to Dashboard"}
          </button>
        </div>
      </form>
    </div>
  );
}
