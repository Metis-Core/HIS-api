import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestStore {
  correlationId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestStore>();

// Request-scoped data (caller and correlation id) without prop-drilling, per standards §6.5.
export const RequestContext = {
  run<T>(store: RequestStore, callback: () => T): T {
    return storage.run(store, callback);
  },

  getCorrelationId(): string | undefined {
    return storage.getStore()?.correlationId;
  },

  getCurrentUserId(): string | undefined {
    return storage.getStore()?.userId;
  },

  setCurrentUserId(userId: string | undefined): void {
    const store = storage.getStore();
    if (store) store.userId = userId;
  },
};
