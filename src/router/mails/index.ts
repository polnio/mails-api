import { type FastifyPluginCallbackJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts'
import { getMailsOpts } from './schemas'
import Mail from '@/models/Mail'
import Session from '@/models/Session'

const mails = ((app, _opts, done) => {
  app.get('/mails/:box?', getMailsOpts, async (req, res) => {
    if (!(await Session.has(req.headers.authorization))) {
      void res.code(401).send({
        message: 'Invalid credentials',
      })
      return
    }
    const mailsPromise = Mail.getAll({
      sessionToken: req.headers.authorization,
      box: req.params.box,
      limit: req.query.limit,
    })
    await mailsPromise
      .then((mails) => {
        const mailsResponse = mails.map((mail) => ({
          id: mail.id,
          from: mail.from,
          to: mail.to,
          subject: mail.subject,
          date: mail.date.toString(),
        }))
        void res
          .code(200)
          .header('Content-Type', 'application/json')
          .send(mailsResponse)
      })
      .catch((err) => {
        void res.code(500).send(err)
      })
  })

  done()
}) satisfies FastifyPluginCallbackJsonSchemaToTs

export default mails
