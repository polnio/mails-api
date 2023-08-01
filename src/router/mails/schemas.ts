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
        flags: { type: 'array', items: { type: 'string' } },
        sort: { type: 'string', enum: ['asc', 'desc'] },
        sortBy: {
          type: 'string',
          enum: ['id', 'from', 'to', 'subject', 'date'],
        },
        query: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        perPage: {
          anyOf: [{ type: 'integer', minimum: 1 }, { const: 'infinity' }],
        },
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

const getMailOpts = {
  schema: {
    headers: authHeader,
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        box: { type: 'string' },
        id: { type: 'number' },
      },
    },
    querystring: {
      type: 'object',
      properties: {
        markSeen: { type: 'boolean' },
        format: {
          type: 'string',
          enum: ['html', 'text'],
        },
      },
    },
    response: {
      200: {
        type: 'object',
        required: ['id', 'from', 'to', 'subject', 'date', 'body'],
        properties: {
          id: { type: 'number' },
          from: { type: 'string' },
          to: { type: 'array', items: { type: 'string' } },
          subject: { type: 'string' },
          date: { type: 'string' },
          body: { type: 'string' },
        },
      },
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

export { getMailsOpts, getMailOpts }
