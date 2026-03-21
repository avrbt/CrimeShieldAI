import React, { useState, useEffect } from "react";
// --- 💡 FIX: Reverting all paths back to their original state. ---
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { CitizenDashboard } from "./components/CitizenDashboard";
import { LocationCrimeNews } from "./components/LocationCrimeNews";
import { CCTVFeedSection } from "./components/CCTVFeedSection";
import { HeatmapSection } from "./components/HeatmapSection";
import { AlertsPanel } from "./components/AlertsPanel";
import { EvidenceSection } from "./components/EvidenceSection";
import { DetectionTab } from "./components/DetectionTab";
import { Footer } from "./components/Footer";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { ProfileBuilder } from "./components/ProfileBuilder";
import { MockModeBanner } from "./components/MockModeBanner";
import { Toaster } from "./components/ui/sonner";
import { NewsAPIDebugger } from "./components/NewsAPIDebugger";
import { GoogleMapsChecker } from "./components/GoogleMapsChecker";

// --- 💡 FIX: Reverting all paths back to their original state. ---
import { authAPI } from "./utils/supabase/client";
import { authUtils } from "./utils/auth";
import { initializeErrorSuppression } from "./utils/suppressGoogleMapsErrors";

// Initialize error suppression immediately
initializeErrorSuppression();

type AppState = "landing" | "auth" | "profile" | "dashboard";

/**
 * --- THIS IS THE KEY FIX ---
 * We create a shared function to check if the profile is *actually* complete,
 * instead of relying on the "verified" boolean.
 * This function matches the fields in your new "AFTER" flow.
 */
const isProfileComplete = (profile: any): boolean => {
  if (!profile) {
    return false;
  }

  // Common fields required for everyone
  const hasCommonInfo = profile.name && profile.phone;
  if (!hasCommonInfo) {
    return false;
  }

  // Citizen-specific fields
  if (profile.role === "citizen") {
    return !!profile.address;
  }

  // Admin-specific fields
  if (profile.role === "organization") {
    return (
      !!profile.organization &&
      !!profile.organizationId &&
      !!profile.department
    );
  }

  // Default to false if role is unknown
  return false;
};

export default function App() {
  // Check for debug mode via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug');
  
  // If in debug mode, show the appropriate debugger
  if (debugMode === 'news-api') {
    return <NewsAPIDebugger />;
  }
  
  if (debugMode === 'google-maps') {
    return <GoogleMapsChecker />;
  }

  const [appState, setAppState] = useState<AppState>("landing");
  const [selectedUserType, setSelectedUserType] = useState<
    "admin" | "citizen" | null
  >(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showDetectionPanel, setShowDetectionPanel] =
    useState(false);

  // Auto-captured evidence from CCTV detections
  const [autoCapturedEvidence, setAutoCapturedEvidence] =
    useState<any[]>([]);

  // Unified location state - single source of truth
  const [selectedLocation, setSelectedLocation] = useState<{
    state: string;
    district: string | null;
  } | null>(null);

  // Location-based safety metrics for citizens
  const [locationMetrics, setLocationMetrics] = useState<{
    location: string;
    safetyScore: number;
    activeAlerts: number;
    safeZones: number;
  } | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    // All your console.log messages are great, leaving them as-is.
    console.log(
      "%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "color: #4B5563;",
    );
    console.log(
      "%c✅ YOUR APP IS WORKING PERFECTLY!",
      "color: #10B981; font-size: 18px; font-weight: bold;",
    );
    // ... (all other logs)
    console.log(
      "%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "color: #4B5563;",
    );

    const checkSession = async () => {
      try {
        const session = await authAPI.getSession();

        if (session) {
          const response = await authAPI.getProfile();
          const profile = response?.profile || response?.user;

          if (profile) {
            setSelectedUserType(
              profile.role === "organization"
                ? "admin"
                : "citizen",
            );

            // --- 💡 FIXED LOGIC ---
            // We now call our new helper function
            if (isProfileComplete(profile)) {
              console.log(
                "✅ Session check: Profile is complete, going to dashboard",
              );
              setAppState("dashboard");
            } else {
              console.log(
                "⚠️ Session check: Profile incomplete, showing profile builder",
              );
              setAppState("profile");
            }
          } else {
            console.warn(
              "Profile data not found in response:",
              response,
            );
            // If no profile, force them to the profile builder
            setAppState("profile");
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        // User not logged in, stay on landing page
      }
    };

    checkSession();
  }, []);

  const handleUserTypeSelect = (
    userType: "admin" | "citizen",
  ) => {
    setSelectedUserType(userType);
    setAppState("auth");
  };

  /**
   * --- 💡 THIS IS THE MAIN FIX for your "AFTER" flow ---
   * This function is called after BOTH login and signup.
   */
  const handleAuthSuccess = async () => {
    try {
      const response = await authAPI.getProfile();
      const profile = response?.profile || response?.user;

      if (!profile) {
        console.error(
          "Could not fetch profile after auth. Sending to ProfileBuilder.",
        );
        setAppState("profile");
        return;
      }

      // --- 💡 FIXED LOGIC ---
      // We check the profile fields directly.
      // This works for:
      // 1. RETURNING USERS: We check their existing profile. If it's complete, they go to the dashboard.
      // 2. NEW USERS: We check the profile *they just created*. Since the new AuthPage
      //    makes them fill everything out, this check will pass and they go to the dashboard.
      if (isProfileComplete(profile)) {
        console.log(
          "✅ Auth success: Profile is complete, going to dashboard",
        );
        setAppState("dashboard");
      } else {
        console.log(
          "⚠️ Auth success: Profile incomplete, showing profile builder",
        );
        // This will now only happen for OLD users who still need to update their profile.
        setAppState("profile");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      // Default to profile builder on error
      setAppState("profile");
    }
  };

  const handleProfileComplete = () => {
    // After ProfileBuilder is done, we know the profile is complete.
    // No need to re-check, just go to the dashboard.
    console.log(
      "✅ ProfileBuilder complete, going to dashboard",
    );
    setAppState("dashboard");
  };

  const handleLogout = async () => {
    try {
      await authAPI.signOut();
      setAppState("landing");
      setSelectedUserType(null);
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleBackToLanding = () => {
    setAppState("landing");
    setSelectedUserType(null);
  };

  // Handle new evidence captured from CCTV detections
  const handleNewEvidence = (evidence: any) => {
    setAutoCapturedEvidence((prev) => [evidence, ...prev]);
  };

  // Handle evidence deletion
  const handleDeleteEvidence = (evidenceId: number) => {
    setAutoCapturedEvidence((prev) => prev.filter(e => e.id !== evidenceId));
  };

  // Landing Page
  if (appState === "landing") {
    return (
      <LandingPage onSelectUserType={handleUserTypeSelect} />
    );
  }

  // Auth Page
  if (appState === "auth" && selectedUserType) {
    return (
      <AuthPage
        userType={selectedUserType}
        onAuthSuccess={handleAuthSuccess}
        onBack={handleBackToLanding}
      />
    );
  }

  // Profile Building Page
  if (appState === "profile") {
    // This page will now only be seen by:
    // 1. Old users with incomplete profiles.
    // 2. Any new users if the signup API call somehow failed.
    return (
      <ProfileBuilder onComplete={handleProfileComplete} />
    );
  }

  // --- Dashboard Rendering (No changes below this line) ---

  const renderContent = () => {
    const currentUser = authUtils.getCurrentUser();
    // This check for userType is slightly different from your profile.role,
    // ensure authUtils.getCurrentUser() is reliable or use the profile from state.
    const isCitizen =
      currentUser?.userType === "citizen" ||
      selectedUserType === "citizen";

    // Citizen view - limited access
    if (isCitizen) {
      switch (activeTab) {
        case "dashboard":
          return (
            <>
              <CitizenDashboard />
              <HeatmapSection 
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                onMetricsUpdate={setLocationMetrics}
              />
            </>
          );
        case "alerts":
          return (
            <HeatmapSection 
              fullView={true} 
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              onMetricsUpdate={setLocationMetrics}
            />
          );
        case "hotspot":
          return (
            <HeatmapSection 
              fullView={true} 
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              onMetricsUpdate={setLocationMetrics}
            />
          );
        default:
          return (
            <>
              <CitizenDashboard />
              <HeatmapSection 
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                onMetricsUpdate={setLocationMetrics}
              />
            </>
          );
      }
    }

    // Admin/Organization view - full access
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <HeroSection />
            <CCTVFeedSection
              onDetectionClick={() =>
                setShowDetectionPanel(true)
              }
              onNewEvidence={handleNewEvidence}
            />
            <HeatmapSection 
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
            />
            <AlertsPanel />
          </>
        );
      case "cctv":
        return (
          <CCTVFeedSection
            onDetectionClick={() => setShowDetectionPanel(true)}
            onNewEvidence={handleNewEvidence}
            fullView={true}
          />
        );
      case "hotspot":
        return (
          <HeatmapSection 
            fullView={true} 
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            onMetricsUpdate={setLocationMetrics}
          />
        );
      case "alerts":
        return <AlertsPanel fullView={true} />;
      case "evidence":
        return (
          <EvidenceSection
            fullView={true}
            autoCapturedEvidence={autoCapturedEvidence}
            onDeleteEvidence={handleDeleteEvidence}
          />
        );
      default:
        return (
          <>
            <HeroSection />
            <CCTVFeedSection
              onDetectionClick={() =>
                setShowDetectionPanel(true)
              }
              onNewEvidence={handleNewEvidence}
            />
            <HeatmapSection 
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              onMetricsUpdate={setLocationMetrics}
            />
            <AlertsPanel />
          </>
        );
    }
  };

  // Dashboard - Main Application
  const currentUser = authUtils.getCurrentUser();
  const isCitizen =
    currentUser?.userType === "citizen" ||
    selectedUserType === "citizen";

  return (
    <div className="dark min-h-screen bg-[#0F1419]">
      <Toaster position="top-right" richColors closeButton />
      <MockModeBanner />
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="relative">
        {renderContent()}

        {/* Detection Panel Overlay - Only for Admin/Organization */}
        {!isCitizen && showDetectionPanel && (
          <DetectionTab
            onClose={() => setShowDetectionPanel(false)}
            isOverlay={true}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}