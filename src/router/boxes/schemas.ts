import { authHeader, authUnauthorizedResponse } from '@/utils/auth'
import { type RouteShorthandOptions } from 'fastify'

const getBoxesOpts = {
  schema: {
    tags: ['boxes'],
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
    tags: ['boxes'],
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

const postBoxOpts = {
  schema: {
    tags: ['boxes'],
    headers: authHeader,
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['sessionToken', 'fullName'],
      properties: {
        sessionToken: { type: 'string' },
        fullName: { type: 'string' },
      },
    },
    response: {
      204: {},
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

const patchBoxOpts = {
  schema: {
    tags: ['boxes'],
    headers: authHeader,
    params: {
      type: 'object',
      additionalProperties: false,
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    },
    body: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fullName: { type: 'string' },
      },
    },
    response: {
      204: {},
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

const deleteBoxOpts = {
  schema: {
    tags: ['boxes'],
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
      204: {},
      401: authUnauthorizedResponse,
    },
  },
} as const satisfies RouteShorthandOptions

export { getBoxesOpts, getBoxOpts, postBoxOpts, patchBoxOpts, deleteBoxOpts }
