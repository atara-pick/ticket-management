import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const { PORT = '3000' } = loadEnv(mode, '.', 'PORT');
  const proxy = { '/api': `http://localhost:${PORT}` };
  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  };
});
