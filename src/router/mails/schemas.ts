import { authUnauthorizedResponse, authHeader } from '@/utils/auth'
import { type RouteShorthandOptions } from 'fastify'

const getMailsOpts = {
  schema: {
    headers: authHeader,
    params: {
      type: 'object',
      properties: {
        box: { type: 'string' },
      },
    },
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        page: { type: 'number' },
        perPage: { type: 'number' },
      },
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'from', 'to', 'subject', 'date'],
          properties: {
            id: { type: 'number' },
            from: { type: 'string' },
            to: { type: 'array', items: { type: 'string' } },
            subject: { type: 'string' },
            date: { type: 'string' },
          },
        },
      },
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

export { getMailsOpts }
