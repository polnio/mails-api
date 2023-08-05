import Fastify from 'fastify'
import router from './router'
import Session from './models/Session'
import { type JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { boxSchema } from './shared/schemas'

const app =
  Fastify().withTypeProvider<
    JsonSchemaToTsProvider<{ references: [typeof boxSchema] }>
  >()

app.addSchema(boxSchema)

type App = typeof app

app.setErrorHandler((err, _request, reply) => {
  const code = err.statusCode ?? 500
  if (code === 500) {
    console.error(err)
  }
  void reply
    .code(code)
    .header('Content-Type', 'application/json')
    .send({
      message: code === 500 ? 'Internal server error' : err.message,
    })
})

app.setNotFoundHandler((req, reply) => {
  const pathname = req.url.split('?')[0] ?? ''
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

export type { App }
