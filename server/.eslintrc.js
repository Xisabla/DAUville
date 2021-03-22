module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',

	env: {
		node: true
	},

	parserOptions: {
		ecmaVersion: 12
	},

	plugins: ['@typescript-eslint', 'simple-import-sort', 'prettier'],

	extends: ['eslint:recommended', 'prettier', 'plugin:@typescript-eslint/recommended'],

	rules: {
		'prettier/prettier': 'error',
		'simple-import-sort/imports': 'error',
		'simple-import-sort/exports': 'error',
		'sort-imports': 'off',
		'import/order': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off'
	}
}
