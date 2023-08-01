import { type FastifyPluginCallback } from 'fastify'
import auth from './auth'
import mails from './mails'

const router = ((app, _opts, done) => {
  void app.register(auth)
  void app.register(mails)

  done()
}) satisfies FastifyPluginCallback

export default router
