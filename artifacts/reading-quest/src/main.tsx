import { createRoot } from "react-dom/client";
import { setProfileIdGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import { getActiveProfileId } from "./lib/profile";
import {
  applyPreferencesToDocument,
  fetchPreferences,
  DEFAULT_PREFERENCES,
} from "./lib/preferences";

// Wire active-profile resolution into every API call before any query fires.
setProfileIdGetter(() => getActiveProfileId());

// Apply baseline preferences immediately, then refine with the server copy.
applyPreferencesToDocument(DEFAULT_PREFERENCES);
fetchPreferences(getActiveProfileId())
  .then(applyPreferencesToDocument)
  .catch(() => {
    /* server may be cold-starting; defaults already applied */
  });

createRoot(document.getElementById("root")!).render(<App />);
