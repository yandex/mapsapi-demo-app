const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin =
	require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const DefinePlugin = require('webpack').DefinePlugin;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const dotenv = require('dotenv');


const isProduction = process.env.NODE_ENV == 'production';
const buildConfig = require('./.config/static/config');

const stylesHandler = isProduction
	? MiniCssExtractPlugin.loader
	: 'style-loader';

dotenv.config();

const isBundleAnalyzer = Boolean(process.env.BUNDLE_ANALYZER);

const APIKEY = process.env.APIKEY;

const output = isBundleAnalyzer
	? 'dist_bundle_analyser'
	: buildConfig.outputPath;

const config = {
	entry: {
		server: '../src/server/index.ts',
		app: '../src/index.tsx'
	},
	context: path.resolve(__dirname, 'public'),
	output: {
		clean: true,
		path: path.resolve(__dirname, output),
		filename: 'assets/[fullhash]/js/[name].js',
		assetModuleFilename: 'assets/images/[hash][ext][query]'
	},
	devServer: {
		open: true,
		hot: true,
		port: 8080,
		host: buildConfig.host,
		allowedHosts: 'all',
		client: {
			overlay: {
				runtimeErrors: error => {
					if (
						error?.message ===
						'ResizeObserver loop completed with undelivered notifications.'
					) {
						console.error(error);
						return false;
					}
					return true;
				}
			}
		}
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					from: './*.png',
					to: './'
				},
				{
					from: './icons/*.png',
					to: './'
				},
				{ from: './*.json', to: './' }
			]
		}),
		new HtmlWebpackPlugin({
			template: 'index.html',
			inject: 'body',
			APIKEY,
			LANGUAGE: buildConfig.defaultLanguage,
			APIURL: buildConfig.apiUrl,
			SUPPORTED_LANGUAGES: JSON.stringify(buildConfig.supportedLanguages),
			minify: {removeComments: true}
		}),
		new DefinePlugin({
			'process.env.APIKEY': JSON.stringify(APIKEY),
			...Object.keys(buildConfig).reduce((acc, key) => {
				acc[`process.env.${key}`] = JSON.stringify(buildConfig[key]);
				return acc;
			}, {})
		})
	],
	optimization: {
		usedExports: false,
		splitChunks: {
			cacheGroups: {
				reactVendor: {
					test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
					name: 'vendor-react',
					chunks: 'all'
				},
				i18nVendor: {
					test: /[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/,
					name: 'vendor-i18n',
					chunks: 'all'
				},
				antVendor: {
					test: /[\\/]node_modules[\\/](@ant-design)[\\/]/,
					name: 'vendor-ant-design',
					chunks: 'all'
				}
			}
		}
	},
	externals: buildConfig.externals,
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/i,
				use: [
					'ts-loader'
				],
				exclude: ['/node_modules/']
			},
			{
				test: /\.module\.css$/i,
				use: [
					stylesHandler,
					{
						loader: 'css-loader',
						options: {
							url: false,
							modules: {
								mode: 'local',
								localIdentName:
									'[name]__[local]--[hash:base64:3]'
							}
						}
					},
					'postcss-loader'
				]
			},
			{
				test: /\.css$/i,
				use: [
					stylesHandler,
					'css-loader',
					'postcss-loader'
				],
				exclude: /\.module\.css$/i
			},
			{
				test: /\.svg$/,
				use: ['@svgr/webpack']
			},
			{
				test: /\.(eot|ttf|woff|woff2|png|jpg|gif)$/i,
				type: 'asset'
			},
			{
				test: /\.sql$/i,
				use: 'raw-loader'
			}

			// Add your rules for custom modules here
			// Learn more about loaders from https://webpack.js.org/loaders/
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.jsx', '.js', '.css', '.png'],
		fallback: {
			fs: false,
			tls: false,
			net: false,
			path: false,
			http: false,
			https: false,
			stream: false,
			crypto: false,
			zlib: false
		}
	}
};

module.exports = () => {
	if (isBundleAnalyzer) {
		config.plugins.push(
			new BundleAnalyzerPlugin({
				openAnalyzer: !isProduction,
				analyzerMode: isProduction ? 'static' : 'server'
			})
		);
	}

	if (isProduction) {
		config.mode = 'production';
		config.plugins.push(
			new MiniCssExtractPlugin({
				filename: 'assets/[fullhash]/css/[name].css'
			})
		);
	} else {
		config.mode = 'development';
	}
	return config;
};
