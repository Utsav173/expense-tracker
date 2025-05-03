// src/types/hono.context.ts
import 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    // Add other variables set by middleware here if needed later
    // e.g., userRole: 'admin' | 'user';
  }
}

// This empty export makes the file a module
export {};
