import { type FastifyPluginCallback } from 'fastify'
import auth from './auth'

const router = ((app, _opts, done) => {
  void app.register(auth)

  done()
}) satisfies FastifyPluginCallback

export default router
