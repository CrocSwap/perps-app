// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ['app/tv/**'],
    },
    {
        files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        plugins: {
            react,
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/jsx-uses-react': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-unused-expressions': [
                'error',
                {
                    allowShortCircuit: true,
                    allowTernary: true,
                },
            ],
            '@typescript-eslint/no-empty-object-type': [
                'error',
                {
                    allowInterfaces: 'always',
                },
            ],
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
];
