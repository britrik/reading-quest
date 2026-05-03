import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/world/:worldId" component={StoryPicker} />
      <Route path="/story/:storyId" component={ChapterPicker} />
      <Route path="/story/:storyId/chapter/:chapterId" component={Session} />
      <Route path="/pet" component={PetDen} />
      <Route path="/grownups" component={Grownups} />
      <Route component={NotFound} />
    </Switch>
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
