import React, { type ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { render, type RenderResult } from "@testing-library/react";

export function renderWithProviders(
  ui: ReactElement,
  initialPath = "/",
): RenderResult & { client: QueryClient } {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const { hook } = memoryLocation({ path: initialPath });
  const result = render(
    <QueryClientProvider client={client}>
      <Router hook={hook}>{ui}</Router>
    </QueryClientProvider>,
  );
  return { ...result, client };
}
