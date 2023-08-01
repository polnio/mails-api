import Fastify from 'fastify'
import router from './router'
import Session from './models/Session'

const app = Fastify()

app.setErrorHandler((err, _request, reply) => {
  void reply
    .code(err.statusCode ?? 500)
    .header('Content-Type', 'application/json')
    .send({
      message: err.message,
    })
})

app.setNotFoundHandler((req, reply) => {
  const pathname = req.url.split('?')[0]
  void reply
    .code(404)
    .header('Content-Type', 'application/json')
    .send({
      message: `Route ${pathname} not found`,
    })
})

void app.register(router)

try {
  void app.listen({ port: 8000 })
} catch (err) {
  app.log.error(err)
  void Session.destroyAll().then(() => process.exit(1))
}
