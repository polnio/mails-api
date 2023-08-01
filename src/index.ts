import Fastify from 'fastify'
import router from './router'

const app = Fastify()

void app.register(router)

try {
  void app.listen({ port: 8000 })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
