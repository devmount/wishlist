const webpack = require('webpack')
const fs = require('fs')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0

module.exports = {
	configureWebpack: {
		plugins: [
			new webpack.DefinePlugin({
				'process.env': {
					PACKAGE_VERSION: '"' + version + '"'
				}
			})
		],
		performance: {
			maxEntrypointSize: 1024000,
			maxAssetSize: 1024000
		},
		output: {
			filename: 'js/[name].js',
			chunkFilename: 'js/[name].bundle.js',
		},
	},
	chainWebpack: config => {
    config.module.rule('vue').use('vue-loader').loader('vue-loader').tap(options => {
			options.compilerOptions = {
				...(options.compilerOptions || {}),
				isCustomElement: tag => /^sl-/.test(tag)
			};
			return options;
		});
  },
	productionSourceMap: false,
	publicPath: '/',
}
