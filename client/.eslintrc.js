module.exports = {
	root: true,
	parser: '@babel/eslint-parser',

	env: {
		browser: true,
		node: true
	},

	parserOptions: {
		babelOptions: {
			configFile: './babel.config.json'
		},
		ecmaVersion: 12
	},

	plugins: ['simple-import-sort', 'prettier'],

	extends: ['eslint:recommended', 'prettier'],

	rules: {
		'prettier/prettier': 'error',
		'simple-import-sort/imports': 'error',
		'simple-import-sort/exports': 'error',
		'sort-imports': 'off',
		'import/order': 'off'
	}
}
