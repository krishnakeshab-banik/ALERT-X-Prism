import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { GovernmentDashboard } from "./components/GovernmentDashboard";
import { PublicDashboard } from "./components/PublicDashboard";
import { PrivateDashboard } from "./components/PrivateDashboard";
import { RoleSelector } from "./components/RoleSelector";
import { LandingPage } from "./components/LandingPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AX</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Alert X
            </h1>
          </div>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
        </div>
      </header>
      
      <main className="flex-1">
        <Content />
      </main>
      
      <Toaster theme="dark" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>

      <Authenticated>
        <div className="container mx-auto px-4 py-8">
          {!userProfile?.profile ? (
            <RoleSelector />
          ) : (
            <DashboardRouter role={userProfile.profile.role} />
          )}
        </div>
      </Authenticated>
    </div>
  );
}

function DashboardRouter({ role }: { role: "government" | "public" | "private" }) {
  switch (role) {
    case "government":
      return <GovernmentDashboard />;
    case "public":
      return <PublicDashboard />;
    case "private":
      return <PrivateDashboard />;
    default:
      return <PublicDashboard />;
  }
}
