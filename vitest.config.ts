import { defineConfig, type Plugin } from 'vitest/config';

// For Nest's dependency-injection metadata, the compiler generates
// `typeof X === "undefined" ? Object : X` inside every decorated class. That ternary is
// generated code, not your logic, yet coverage counts it as a branch that can never be fully
// covered. In tests only, it is replaced by a call to a helper defined outside src/
// (test/decorator-metadata.setup.ts), so branch coverage measures your real code.
function ignoreDecoratorMetadataBranches(): Plugin {
  const metadataTernary = /typeof (\w+) === "undefined" \? Object : \1/g;
  return {
    name: 'ignore-decorator-metadata-branches',
    enforce: 'post',
    transform(code, id) {
      if (!id.endsWith('.ts') || !code.includes('design:')) return null;
      return {
        code: code.replace(metadataTernary, 'globalThis.__designType(() => $1)'),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [ignoreDecoratorMetadataBranches()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    setupFiles: ['./test/decorator-metadata.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.dto.ts',
        'src/**/*.entity.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
