import path from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

import type { PluginOption } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const isAnalyze = process.env.ANALYZE === 'true';

    const plugins: PluginOption[] = [react()];

    // Bundle 분석 플러그인 (ANALYZE=true 일 때만 활성화)
    if (isAnalyze) {
        plugins.push(
            visualizer({
                filename: 'dist/bundle-stats.html',
                open: true,
                gzipSize: true,
                brotliSize: true,
                template: 'treemap', // 'sunburst' | 'treemap' | 'network'
            }) as PluginOption
        );
    }

    return {
        plugins,

        // 경로 별칭 설정
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@api': path.resolve(__dirname, './src/api'),
                '@config': path.resolve(__dirname, './src/config'),
                '@features': path.resolve(__dirname, './src/features'),
                '@components': path.resolve(__dirname, './src/components'),
                '@services': path.resolve(__dirname, './src/services'),
                '@stores': path.resolve(__dirname, './src/stores'),
                '@hooks': path.resolve(__dirname, './src/hooks'),
                '@shared': path.resolve(__dirname, './src/shared'),
                '@types': path.resolve(__dirname, './src/types'),
                '@constants': path.resolve(__dirname, './src/constants'),
            },
        },

        // 개발 서버 설정
        server: {
            port: 5173,
            open: true,
            host: true,
        },

        // 빌드 설정
        build: {
            outDir: 'dist',
            sourcemap: mode !== 'production',
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom'],
                        three: [
                            'three',
                            '@react-three/fiber',
                            '@react-three/drei',
                        ],
                        router: ['react-router-dom'],
                        query: ['@tanstack/react-query'],
                    },
                },
            },
        },

        // 환경 변수 설정
        define: {
            __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
        },
    };
});
