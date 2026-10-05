import { InMemoryCreatorMemoryStore } from "@creatoros/creator-memory";
import { ModelRouter, ModelCouncil } from "@creatoros/model-router";
import type { RenderJobRecord } from "./schemas.js";

export interface AppServices {
  memoryStore: InMemoryCreatorMemoryStore;
  router: ModelRouter;
  council: ModelCouncil;
  renderJobs: Map<string, RenderJobRecord>;
}

export function createServices(overrides?: Partial<AppServices>): AppServices {
  const memoryStore = overrides?.memoryStore ?? new InMemoryCreatorMemoryStore();
  const router = overrides?.router ?? new ModelRouter();
  const council = overrides?.council ?? new ModelCouncil(router);
  const renderJobs = overrides?.renderJobs ?? new Map<string, RenderJobRecord>();

  return {
    memoryStore,
    router,
    council,
    renderJobs,
  };
}
