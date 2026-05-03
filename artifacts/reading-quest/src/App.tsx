import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Home from "@/pages/Home";
import StoryPicker from "@/pages/StoryPicker";
import ChapterPicker from "@/pages/ChapterPicker";
import Session from "@/pages/Session";
import PetDen from "@/pages/PetDen";
import Grownups from "@/pages/Grownups";
import ProfilePicker from "@/pages/ProfilePicker";
import Onboarding from "@/pages/Onboarding";
import Settings from "@/pages/Settings";
import { getActiveProfileId, setActiveProfileId } from "@/lib/profile";
import { listProfiles } from "@/lib/profilesApi";
import { PageLoader } from "@/components/PageStates";

const queryClient = new QueryClient();

type GateStatus = "loading" | "needs-picker" | "needs-onboarding" | "ready";

function ProfileGate({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [status, setStatus] = useState<GateStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      // The /grownups area must always work without picking a kid profile;
      // grown-ups manage profiles from there. Same for the picker itself.
      if (location === "/grownups" || location === "/profiles") {
        if (!cancelled) setStatus("ready");
        return;
      }
      try {
        const profiles = await listProfiles();
        const activeId = getActiveProfileId();
        const matched = activeId !== null ? profiles.find((p) => p.id === activeId) : null;

        if (!matched) {
          // If exactly one profile exists and none is selected, auto-pick it
          // (preserves the single-profile UX from Tasks #5/#6).
          if (profiles.length === 1 && activeId === null) {
            setActiveProfileId(profiles[0]!.id);
            if (!profiles[0]!.onboarded && location !== "/onboarding") {
              if (!cancelled) {
                setStatus("needs-onboarding");
                setLocation("/onboarding");
              }
              return;
            }
            if (!cancelled) setStatus("ready");
            return;
          }
          if (!cancelled) {
            setStatus("needs-picker");
            setLocation("/profiles");
          }
          return;
        }

        if (!matched.onboarded && location !== "/onboarding") {
          if (!cancelled) {
            setStatus("needs-onboarding");
            setLocation("/onboarding");
          }
          return;
        }
        if (!cancelled) setStatus("ready");
      } catch {
        // Backend down: still render so the existing PageError UI surfaces.
        if (!cancelled) setStatus("ready");
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [location, setLocation]);

  if (status === "loading") return <PageLoader />;
  return <>{children}</>;
}

function Router() {
  return (
    <ProfileGate>
      <Switch>
        <Route path="/profiles" component={ProfilePicker} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/settings" component={Settings} />
        <Route path="/" component={Home} />
        <Route path="/world/:worldId" component={StoryPicker} />
        <Route path="/story/:storyId" component={ChapterPicker} />
        <Route path="/story/:storyId/chapter/:chapterId" component={Session} />
        <Route path="/pet" component={PetDen} />
        <Route path="/grownups" component={Grownups} />
        <Route component={NotFound} />
      </Switch>
    </ProfileGate>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
