import { authHeader, authUnauthorizedResponse } from '@/utils/auth'
import { type RouteShorthandOptions } from 'fastify'

const getBoxesOpts = {
  schema: {
    headers: authHeader,
    response: {
      200: {
        type: 'array',
        items: {
          $ref: 'box',
        },
      },
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

const getBoxOpts = {
  schema: {
    headers: authHeader,
    params: {
      type: 'object',
      additionalProperties: false,
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    },
    response: {
      200: {
        $ref: 'box',
      },
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

export { getBoxesOpts, getBoxOpts }
