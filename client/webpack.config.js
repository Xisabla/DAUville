const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
	mode: 'development',

	entry: './src/index.js',

	context: path.resolve(__dirname),

	output: {
		path: path.resolve(__dirname, 'public', 'dist'),
		filename: 'js/app.js',
		publicPath: '/dist/'
	},

	devtool: 'source-map',

	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			},

			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader']
			},

			{
				test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
				use: [{ loader: 'file-loader' }]
			},

			{
				test: /\.(png|jpg|gif|svg)$/i,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 8192,
							name: 'img/[name].[ext]'
						}
					}
				]
			}
		]
	},

	plugins: [
		new MiniCssExtractPlugin({
			filename: 'css/app.css'
		})
	],

	devServer: {
		contentBase: path.join(__dirname, 'public'),
		compress: true,
		hot: true,
		port: 3001
	},

	performance: {
		hints: false
	}
}
