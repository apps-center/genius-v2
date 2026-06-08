/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// App SPA classique (PAS de lib mode).
export default defineConfig({
    plugins: [react()],
    test: {
        // logic/ testable sans navigateur
        environment: 'node',
        include: ['src/**/*.test.ts'],
    },
});
