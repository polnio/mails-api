import { type FastifyPluginCallback } from 'fastify'
import auth from './auth'
import mails from './mails'
import boxes from './boxes'

const router = ((app, _opts, done) => {
  void app.register(auth)
  void app.register(mails)
  void app.register(boxes)

  done()
}) satisfies FastifyPluginCallback

export default router
