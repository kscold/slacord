import { defineConfig } from 'tsup';

export default defineConfig({
    clean: true,
    dts: false,
    entry: {
        main: 'src/main/index.ts',
        preload: 'src/preload/index.ts',
    },
    format: ['cjs'],
    outDir: 'dist',
    sourcemap: true,
    splitting: false,
    target: 'node20',
});
