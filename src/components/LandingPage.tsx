import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function LandingPage() {
  const [selectedAccess, setSelectedAccess] = useState<"government" | "public" | "private" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  
  const { signIn } = useAuthActions();
  const createProfile = useMutation(api.users.createUserProfile);
  const initializeCameras = useMutation(api.cameras.initializeDemoCameras);

  const handleGovernmentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", flow);
      
      await signIn("password", formData);
      
      // After successful authentication, create profile
      await createProfile({
        role: "government",
        organization: undefined,
      });
      
      // Initialize demo cameras for government users
      await initializeCameras();
      
      toast.success("Signed in successfully!");
    } catch (error) {
      let toastTitle = "";
      if (error.message.includes("Invalid password")) {
        toastTitle = "Invalid password. Please try again.";
      } else {
        toastTitle = flow === "signIn" 
          ? "Could not sign in, did you mean to sign up?" 
          : "Could not sign up, did you mean to sign in?";
      }
      toast.error(toastTitle);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !organization) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", flow);
      
      await signIn("password", formData);
      
      // After successful authentication, create profile
      await createProfile({
        role: "private",
        organization: organization,
      });
      
      toast.success("Account created/signed in successfully!");
    } catch (error) {
      let toastTitle = "";
      if (error.message.includes("Invalid password")) {
        toastTitle = "Invalid password. Please try again.";
      } else {
        toastTitle = flow === "signIn" 
          ? "Could not sign in, did you mean to sign up?" 
          : "Could not sign up, did you mean to sign in?";
      }
      toast.error(toastTitle);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublicAccess = async () => {
    setIsLoading(true);
    try {
      await signIn("anonymous");
      
      // Wait a bit for authentication to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful authentication, create profile
      await createProfile({
        role: "public",
        organization: undefined,
      });
      
      toast.success("Accessing public dashboard...");
    } catch (error) {
      console.error("Public access error:", error);
      toast.error("Failed to access public dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousGovernmentAccess = async () => {
    setIsLoading(true);
    try {
      await signIn("anonymous");
      
      // Wait a bit for authentication to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful authentication, create profile
      await createProfile({
        role: "government",
        organization: undefined,
      });
      
      // Initialize demo cameras for government users
      await initializeCameras();
      
      toast.success("Accessing government dashboard...");
    } catch (error) {
      console.error("Government access error:", error);
      toast.error("Failed to access government dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousPrivateAccess = async () => {
    setIsLoading(true);
    try {
      await signIn("anonymous");
      
      // Wait a bit for authentication to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful authentication, create profile
      await createProfile({
        role: "private",
        organization: "Demo Organization",
      });
      
      toast.success("Accessing private dashboard...");
    } catch (error) {
      console.error("Private access error:", error);
      toast.error("Failed to access private dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const accessOptions = [
    {
      id: "government" as const,
      title: "Government",
      description: "Access to all cameras, incident management, and analytics",
      icon: "🏛️",
      features: ["Live Camera Monitoring", "Incident Management", "Traffic Analytics", "Emergency Response"],
      requiresAuth: true,
    },
    {
      id: "public" as const,
      title: "Public",
      description: "View traffic conditions and get route suggestions",
      icon: "👥",
      features: ["Traffic Map", "Route Planning", "Incident Alerts", "Real-time Updates"],
      requiresAuth: false,
    },
    {
      id: "private" as const,
      title: "Private",
      description: "Manage your own cameras and receive security alerts",
      icon: "🏢",
      features: ["Camera Management", "Security Alerts", "Operational Hours", "Unauthorized Access Detection"],
      requiresAuth: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-700/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">AX</span>
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Alert X
            </h1>
            <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
              AI-Powered Traffic Monitoring & Incident Detection Platform
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
              Advanced computer vision and machine learning technology to monitor traffic conditions, 
              detect incidents in real-time, and provide intelligent insights for safer, more efficient transportation.
            </p>
          </div>
        </div>
      </div>

      {/* Access Options Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Access Level</h2>
          <p className="text-gray-400 text-lg">Select the appropriate access level for your needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {accessOptions.map((option) => (
            <div
              key={option.id}
              className={`p-8 rounded-2xl border-2 transition-all ${
                selectedAccess === option.id
                  ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600 hover:shadow-lg"
              }`}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">{option.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{option.title}</h3>
                <p className="text-gray-400">{option.description}</p>
              </div>
              
              <div className="space-y-3 mb-8">
                {option.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedAccess(option.id)}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                  selectedAccess === option.id
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                }`}
              >
                {option.requiresAuth ? "Sign In Required" : "Access Now"}
              </button>
            </div>
          ))}
        </div>

        {/* Authentication Forms */}
        {selectedAccess && (
          <div className="max-w-md mx-auto mt-12">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-center mb-6">
                {selectedAccess === "government" ? "Government Access" : 
                 selectedAccess === "private" ? "Private Account Access" : "Public Access"}
              </h3>

              {selectedAccess === "public" ? (
                <div className="text-center">
                  <p className="text-gray-400 mb-6">
                    Public access allows you to view traffic conditions and get route suggestions without creating an account.
                  </p>
                  <button
                    onClick={handlePublicAccess}
                    disabled={isLoading}
                    className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Accessing..." : "Access Public Dashboard"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Anonymous Access Button */}
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">
                      {selectedAccess === "government" 
                        ? "Quick demo access (no account required)" 
                        : "Quick demo access (no account required)"}
                    </p>
                    <button
                      onClick={selectedAccess === "government" ? handleAnonymousGovernmentAccess : handleAnonymousPrivateAccess}
                      disabled={isLoading}
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Accessing..." : `Access ${selectedAccess === "government" ? "Government" : "Private"} Dashboard (Demo)`}
                    </button>
                  </div>

                  <div className="flex items-center">
                    <hr className="flex-1 border-gray-600" />
                    <span className="mx-4 text-gray-400 text-sm">or</span>
                    <hr className="flex-1 border-gray-600" />
                  </div>

                  {/* Email/Password Form */}
                  <form onSubmit={selectedAccess === "government" ? handleGovernmentSignIn : handlePrivateAccess}>
                    <div className="space-y-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                      />
                      {selectedAccess === "private" && (
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="Organization Name"
                          required
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                        />
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 mt-6"
                    >
                      {isLoading ? "Processing..." : flow === "signIn" ? "Sign In" : "Sign Up"}
                    </button>

                    <div className="text-center mt-4">
                      <span className="text-gray-400 text-sm">
                        {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
                        className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer text-sm"
                      >
                        {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <button
                onClick={() => setSelectedAccess(null)}
                className="w-full mt-4 py-2 px-4 text-gray-400 hover:text-gray-200 transition-colors"
              >
                ← Back to options
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
