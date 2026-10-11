/** @type {import('jest').Config} */
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic' } },
        },
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-tests.ts'],
  collectCoverageFrom: [
    'src/features/cart/**/*.{ts,tsx}',
    'src/features/products/productsSlice.ts',
    'src/features/products/ProductListThunk.tsx',
    'src/features/products/ProductGrid.tsx',
    'src/features/products/ProductCard.tsx',
    'src/features/favorites/favoritesStore.ts',
    'src/features/favorites/FavoriteButton.tsx',
    'src/utils/**/*.{ts,tsx}',
    '!src/**/*.types.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageThreshold: {
    global: { statements: 70, branches: 70, functions: 70, lines: 70 },
  },
  coverageReporters: ['text', 'html', 'lcov'],
}
