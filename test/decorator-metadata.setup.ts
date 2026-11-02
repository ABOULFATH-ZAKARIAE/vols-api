// Test-only helper used by vitest.config.ts. It returns a class used in Nest's
// dependency-injection metadata, or Object when that class only exists as a type.
(globalThis as Record<string, unknown>).__designType = (read: () => unknown): unknown => {
  try {
    return read();
  } catch {
    return Object;
  }
};
