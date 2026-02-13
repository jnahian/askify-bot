//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      '.output/**',
      'dist/**',
      'build/**',
      '.tanstack/**',
      '.vinxi/**',
      '.vercel/**',
      'scripts/**',
    ],
  },
]
