const authHeader = {
  type: 'object',
  required: ['Authorization'],
  properties: {
    Authorization: { type: 'string' },
  },
} as const

const authUnauthorizedResponse = {
  type: 'object',
  additionalProperties: false,
  required: ['message'],
  properties: {
    message: { type: 'string' },
  },
} as const

export { authHeader, authUnauthorizedResponse }
