/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// App SPA classique (PAS de lib mode).
export default defineConfig({
    plugins: [react()],
    test: {
        // logic/ testable sans navigateur : environnement 'node' par defaut.
        // Un rare test de COMPORTEMENT d'ui (timing de flip) bascule en jsdom via le
        // docblock "// @vitest-environment jsdom" en tete de fichier, sans alourdir le reste.
        environment: 'node',
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
