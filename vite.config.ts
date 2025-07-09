import { defineConfig } from 'vite';
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
			// 'shoelace': 'node_modules/@shoelace-style/shoelace',
		},
		extensions: ['.ts', '.js', '.vue'],
	},
	test: {
		globals: true,
		environment: "jsdom",
	},
});
