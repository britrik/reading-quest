import React from "react";
import { PageError } from "./PageStates";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ReadingQuest] uncaught:", error);
  }

  render() {
    if (this.state.hasError) {
      return <PageError />;
    }
    return this.props.children;
  }
}
