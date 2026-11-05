import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: tag => tag.startsWith('sl-')
				}
			}
		})
	],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		// Forward API requests to the local ddev backend
		proxy: {
			'/api.php': {
				target: 'https://wishlist.ddev.site',
				changeOrigin: true,
				secure: false,
			},
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
	},
});
