import { defineConfig } from 'vite';

export default defineConfig({
    // Use relative base path to ensure the app works in subdirectories (e.g. GitHub Pages)
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
});
