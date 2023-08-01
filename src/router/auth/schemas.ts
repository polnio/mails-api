import { type RouteShorthandOptions } from 'fastify'

const loginOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
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
      401: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
        },
      },
    },
  },
} as const satisfies RouteShorthandOptions

const logoutOpts = {
  schema: {
    headers: {
      type: 'object',
      required: ['Authorization'],
      properties: {
        Authorization: { type: 'string' },
      },
    },
    response: {
      204: {},
    },
  },
} as const satisfies RouteShorthandOptions

export { loginOpts, logoutOpts }
