import Box from '@/models/Box'
import Session from '@/models/Session'
import { type FastifyPluginCallbackJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts'
import { getBoxOpts, getBoxesOpts } from './schemas'
import { type App } from '@/index'

const boxes = ((app: App, _opts, done) => {
  // @ts-expect-error 2615
  app.get('/boxes', getBoxesOpts, async (req, res) => {
    if (!(await Session.has(req.headers.authorization))) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const boxes = await Box.getAll({
      sessionToken: req.headers.authorization,
    })
    // @ts-expect-error 2345
    void res.code(200).header('Content-Type', 'application/json').send(boxes)
  })

  app.post('/boxes', async (req, res) => {
    throw new Error('Not implemented')
  })

  // @ts-expect-error 2615
  app.get('/boxes/:name', getBoxOpts, async (req, res) => {
    if (!(await Session.has(req.headers.authorization))) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const name = decodeURIComponent(req.params.name)
    const box = await Box.get({
      sessionToken: req.headers.authorization,
      name,
    })
    console.log(box)
    if (box === undefined) {
      void res.code(404).send({
        message: 'Box not found',
      })
      return
    }
    // @ts-expect-error 2345
    void res.code(200).header('Content-Type', 'application/json').send(box)
  })

  done()
}) satisfies FastifyPluginCallbackJsonSchemaToTs

export default boxes
