import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const alias: Record<string, string> = {};
  if (mode === 'profiling') alias['react-dom/client'] = 'react-dom/profiling';
  return {
    plugins: [react()],
    resolve: { alias },
    build: {
      manifest: true,
      rolldownOptions: {
        input: ['index', 'before', 'after']
          .filter(name => existsSync(resolve(import.meta.dirname, `${name}.html`)))
          .map(name => resolve(import.meta.dirname, `${name}.html`)),
      },
    },
  };
});
