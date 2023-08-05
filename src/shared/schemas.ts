const boxSchema = {
  $id: 'box',
  type: 'object',
  additionalProperties: false,
  required: ['name', 'flags', 'delimiter', 'children'],
  properties: {
    name: { type: 'string' },
    flags: { type: 'array', items: { type: 'string' } },
    delimiter: { type: 'string' },
    children: {
      type: 'array',
      items: { $ref: 'box' },
    },
  },
} as const

export { boxSchema }
