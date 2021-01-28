process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
	configureWebpack: {
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
