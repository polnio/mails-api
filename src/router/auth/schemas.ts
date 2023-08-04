import { authHeader, authUnauthorizedResponse } from '@/utils/auth'
import { type RouteShorthandOptions } from 'fastify'

const loginOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password', 'imap', 'smtp'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        imap: {
          type: 'object',
          required: ['host', 'port'],
          properties: {
            host: { type: 'string' },
            port: { type: 'number' },
          },
        },
        smtp: {
          type: 'object',
          required: ['host', 'port'],
          properties: {
            host: { type: 'string' },
            port: { type: 'number' },
          },
        },
      },
    },
    response: {
      200: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

const logoutOpts = {
  schema: {
    headers: authHeader,
    response: {
      204: {},
    },
  },
} as const satisfies RouteShorthandOptions

export { loginOpts, logoutOpts }
