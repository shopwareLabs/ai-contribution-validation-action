import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { VitestReporter } from 'tdd-guard-vitest';

export default defineConfig({
  test: {
    // Enable globals for Jest-like API (describe, it, expect)
    globals: true,
    
    // Types configuration
    typecheck: {
      tsconfig: './tsconfig.json'
    },
    
    // Use happy-dom for DOM testing if needed
    environment: 'happy-dom',
    
    // Test file patterns
    include: ['test/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', 'dist', 'lib', 'coverage'],
    
    // Don't fail when no tests are found
    passWithNoTests: true,
    
    // Setup file
    setupFiles: ['./test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.interface.ts',
        'src/**/*.type.ts',
        'src/index.ts' // Entry point often excluded from coverage
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      reportOnFailure: true
    },
    
    // Test timeout for CI environments
    testTimeout: 30000,
    
    // Watch mode configuration
    watch: process.env.CI ? false : true,
    
    // GitHub Actions reporter and TDD Guard integration
    reporters: process.env.GITHUB_ACTIONS 
      ? ['default', 'github-actions', new VitestReporter(__dirname)] 
      : ['default', 'verbose', new VitestReporter(__dirname)],
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: process.env.CI ? 2 : undefined,
        minThreads: 1
      }
    }
  },
  
  // Path resolution to match tsconfig.json
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  
  // Define configuration for different test types
  define: {
    __TEST__: true
  }
});