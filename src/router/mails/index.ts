import { type FastifyPluginCallbackJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts'
import transpile from 'imap-criteria-transpiler'
import {
  getMailOpts,
  getMailsOpts,
  patchMailOpts,
  postMailOpts,
} from './schemas'
import Mail, { type MailProperties } from '@/models/Mail'
import Session from '@/models/Session'

const mails = ((app, _opts, done) => {
  app.get('/mails/:box?', getMailsOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }

    const perPage =
      (req.query.perPage === 'infinity' ? Infinity : req.query.perPage) ??
      Infinity

    const query = transpile(req.query.query ?? '')

    const mails = await Mail.getAll({
      session,
      box: req.params.box,
      criteria: query,
      page: req.query.page,
      perPage,
    })

    const sortedMails = mails.sort((a, b) =>
      sortMails(a, b, req.query.sortBy ?? 'id'),
    )
    if (req.query.sort === 'desc') {
      sortedMails.reverse()
    }

    const mailsResponse = sortedMails.map((mail) => ({
      id: mail.id,
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      date: mail.date.toString(),
      flags: mail.flags,
    }))
    void res
      .code(200)
      .header('Content-Type', 'application/json')
      .send(mailsResponse)
  })

  app.get('/mails/:box/:id', getMailOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const mail = await Mail.get({
      session,
      box: req.params.box,
      id: req.params.id,
      markSeen: req.query.markSeen,
      format: req.query.format,
    })
    void res.code(200).header('Content-Type', 'application/json').send({
      id: mail.id,
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      date: mail.date.toString(),
      body: mail.body,
      flags: mail.flags,
    })
  })

  app.post('/mails', postMailOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    await Mail.create({
      session,
      from: req.body.from,
      to: req.body.to,
      subject: req.body.subject,
      body: req.body.body,
      format: req.body.format,
    })
    void res.code(204).send()
  })

  app.patch('/mails/:box/:id', patchMailOpts, async (req, res) => {
    const session = await Session.get(req.headers.authorization)
    if (session === undefined) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const newMail = await Mail.update({
      session,
      box: req.params.box,
      id: req.params.id,
      flags:
        req.body.removeAllFlags === true
          ? req.body.flags ?? []
          : {
              add: req.body.flags,
            },
      keywords:
        req.body.removeAllKeywords === true
          ? req.body.keywords ?? []
          : {
              add: req.body.keywords,
            },
      newBox: req.body.box,
    })

    void res.code(200).send({
      id: newMail.id,
      from: newMail.from,
      to: newMail.to,
      subject: newMail.subject,
      date: newMail.date.toString(),
      body: newMail.body,
      flags: newMail.flags,
    })
  })

  done()
}) satisfies FastifyPluginCallbackJsonSchemaToTs

export default mails

function sortMails(
  a: MailProperties,
  b: MailProperties,
  sortBy: keyof MailProperties,
): number {
  const left = a[sortBy]
  const right = b[sortBy]
  if (left instanceof Date) {
    if (!(right instanceof Date)) {
      // ? Never
      throw new Error()
    }
    return left.getTime() - right.getTime()
  }
  if (typeof left === 'string') {
    if (typeof right !== 'string') {
      // ? Never
      throw new Error()
    }
    return left.localeCompare(right)
  }
  if (typeof left === 'boolean') {
    if (typeof right !== 'boolean') {
      // ? Never
      throw new Error()
    }
    return Number(left) - Number(right)
  }
  if (typeof left === 'number') {
    if (typeof right !== 'number') {
      // ? Never
      throw new Error()
    }
    return left - right
  }
  throw new Error('Incompatible type')
}
