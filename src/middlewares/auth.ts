import { type preHandlerHookHandler } from 'fastify'

const auth = (async (req, res) => {
  void res.code(200).send({ hello: 'world' })
}) satisfies preHandlerHookHandler

export default auth
