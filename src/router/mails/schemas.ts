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
          required: ['id', 'from', 'to', 'subject', 'date', 'flags'],
          properties: {
            id: { type: 'number' },
            from: { type: 'string' },
            to: { type: 'array', items: { type: 'string' } },
            subject: { type: 'string' },
            date: { type: 'string' },
            flags: { type: 'array', items: { type: 'string' } },
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
        required: ['id', 'from', 'to', 'subject', 'date', 'body', 'flags'],
        properties: {
          id: { type: 'number' },
          from: { type: 'string' },
          to: { type: 'array', items: { type: 'string' } },
          subject: { type: 'string' },
          date: { type: 'string' },
          body: { type: 'string' },
          flags: { type: 'array', items: { type: 'string' } },
        },
      },
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

const postMailOpts = {
  schema: {
    headers: authHeader,
    body: {
      type: 'object',
      required: ['from', 'to', 'subject', 'body'],
      properties: {
        from: { type: 'string' },
        to: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        body: { type: 'string' },
        format: {
          enum: ['html', 'text'],
        },
      },
    },
    response: {
      /* 201: {
        type: 'object',
        required: ['id', 'from', 'to', 'subject', 'date', 'body', 'flags'],
        properties: {
          id: { type: 'number' },
          from: { type: 'string' },
          to: { type: 'array', items: { type: 'string' } },
          subject: { type: 'string' },
          date: { type: 'string' },
          body: { type: 'string' },
          flags: { type: 'array', items: { type: 'string' } },
        },
      }, */
      204: {},
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

const patchMailOpts = {
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
    body: {
      type: 'object',
      properties: {
        flags: { type: 'array', items: { type: 'string' } },
        keywords: { type: 'array', items: { type: 'string' } },
        // box: { type: 'string' },
        box: {
          type: 'object',
          required: ['location', 'action'],
          properties: {
            location: {
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } },
              ],
            },
            action: {
              enum: ['copy', 'move'],
            },
          },
        },

        removeAllFlags: { type: 'boolean' },
        removeAllKeywords: { type: 'boolean' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          from: { type: 'string' },
          to: { type: 'array', items: { type: 'string' } },
          subject: { type: 'string' },
          date: { type: 'string' },
          body: { type: 'string' },
          flags: { type: 'array', items: { type: 'string' } },
        },
      },
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

export { getMailsOpts, getMailOpts, patchMailOpts, postMailOpts }
