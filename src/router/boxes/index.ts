import Box from '@/models/Box'
import Session from '@/models/Session'
import { type FastifyPluginCallbackJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts'
import {
  deleteBoxOpts,
  getBoxOpts,
  getBoxesOpts,
  patchBoxOpts,
  postBoxOpts,
} from './schemas'
import { type App } from '@/index'

const boxes = ((app: App, _opts, done) => {
  // @ts-expect-error 2615
  app.get('/boxes', getBoxesOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const boxes = await Box.getAll({ session })
    // @ts-expect-error 2345
    void res.code(200).header('Content-Type', 'application/json').send(boxes)
  })

  app.post('/boxes', postBoxOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    await Box.create({ session, fullName: req.body.fullName })
    void res.code(204).send()
  })

  // @ts-expect-error 2615
  app.get('/boxes/:name', getBoxOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const name = decodeURIComponent(req.params.name)
    const box = await Box.get({ session, name })
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

  app.patch('/boxes/:name', patchBoxOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const name = decodeURIComponent(req.params.name)
    await Box.update({
      session,
      name,
      newName: req.body.fullName,
    })
    void res.code(204).send()
  })

  app.delete('/boxes/:name', deleteBoxOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const name = decodeURIComponent(req.params.name)
    await Box.delete({ session, name })
    void res.code(204).send()
  })

  done()
}) satisfies FastifyPluginCallbackJsonSchemaToTs

export default boxes
