import { type FastifyPluginCallbackJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts'
import Connection from '@/models/Connection'
import { loginOpts, logoutOpts } from './schemas'

const auth = ((app, _opts, done) => {
  app.post('/login', loginOpts, (req, res) => {
    const credentials = req.body
    Connection.connect(credentials)
      .then((connection) => {
        void res.code(200).header('Content-Type', 'application/json').send({
          token: connection.token,
        })
      })
      .catch(() => {
        void res.code(401).send({
          message: 'Invalid credentials',
        })
      })
  })

  app.post('/logout', logoutOpts, (req, res) => {
    void Connection.destroy(req.headers.authorization)
    void res.code(204).send()
  })

  done()
}) satisfies FastifyPluginCallbackJsonSchemaToTs

export default auth
