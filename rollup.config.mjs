import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
  },
  plugins: [typescript(), terser()],
  external: [
    'fastify',
    '@fastify/swagger',
    '@fastify/swagger-ui',
    'imap',
    'nodemailer',
    'uuid',
    'imap-criteria-transpiler',
    'mailparser',
    'zod',
  ],
}
