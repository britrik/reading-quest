import React, { type ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { render, type RenderResult } from "@testing-library/react";

interface RenderOptions {
  initialPath?: string;
  routePattern?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  initialPathOrOptions: string | RenderOptions = "/",
): RenderResult & { client: QueryClient } {
  const opts: RenderOptions =
    typeof initialPathOrOptions === "string"
      ? { initialPath: initialPathOrOptions }
      : initialPathOrOptions;
  const initialPath = opts.initialPath ?? "/";

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const { hook } = memoryLocation({ path: initialPath });
  const tree = opts.routePattern ? <Route path={opts.routePattern}>{ui}</Route> : ui;
  const result = render(
    <QueryClientProvider client={client}>
      <Router hook={hook}>{tree}</Router>
    </QueryClientProvider>,
  );
  return { ...result, client };
}
