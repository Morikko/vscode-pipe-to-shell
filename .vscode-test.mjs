import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.test.js',
    mocha: {
        ui: 'bdd',
        timeout: 20000,
        require: ['source-map-support/register'],
    },
    version: "1.113.0"
});