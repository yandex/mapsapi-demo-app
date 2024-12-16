module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es2021: true
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended'
	],
	overrides: [
		{
			files: [
				'webpack.config.js',
				'./tools/resolve-vendor-strategy-preloader.js'
			],
			rules: {
				'@typescript-eslint/no-var-requires': 'off'
			}
		}
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	plugins: ['@typescript-eslint', 'react', 'simple-import-sort', 'import'],
	rules: {
		'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
		'simple-import-sort/exports': 'error',
		'import/first': 'error',
		'import/newline-after-import': 'error',
		'import/no-duplicates': 'error',
		'simple-import-sort/imports': [
			'error',
			{
				groups: [
					[
						'^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)'
					],
					// Packages. `react` related packages come first.
					['^react', '^@?\\w', '^i18next'],
					['^antd', '^@ant-design'],
					// Internal packages.
					[
						'^(@|@company|@ui|components|utils|config|vendored-lib)(/.*|$)'
					],
					// Side effect imports.
					['^\\u0000'],
					// Parent imports. Put `..` last.
					['^\\.\\.(?!/?$)', '^\\.\\./?$'],
					// Other relative imports. Put same-folder imports and `.` last.
					['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
					// Style imports.
					['^.+\\.s?css$']
				]
			}
		]
	}
};
