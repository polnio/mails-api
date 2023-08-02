import { type FastifyPluginCallbackJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts'
import search from 'query-searcher'
import { getMailOpts, getMailsOpts } from './schemas'
import Mail, { type MailProperties } from '@/models/Mail'
import Session from '@/models/Session'

const mails = ((app, _opts, done) => {
  app.get('/mails/:box?', getMailsOpts, async (req, res) => {
    if (!(await Session.has(req.headers.authorization))) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }

    const mails = await Mail.getAll({
      sessionToken: req.headers.authorization,
      box: req.params.box,
    })

    const filteredMails = search(
      req.query.query ?? '',
      mails.map((mail) => mail.getProperties()),
    )

    const sortedMails = filteredMails.sort((a, b) =>
      sortMails(a, b, req.query.sortBy ?? 'id'),
    )
    if (req.query.sort === 'desc') {
      sortedMails.reverse()
    }

    const page = req.query.page ?? 1
    const perPage =
      (req.query.perPage === 'infinity' ? Infinity : req.query.perPage) ?? 10
    const paginatedMails = (() => {
      if (perPage > sortedMails.length) {
        if (page > 1) {
          return []
        }
        return sortedMails
      }
      return sortedMails.slice((page - 1) * perPage, page * perPage)
    })()

    const mailsResponse = paginatedMails.map((mail) => ({
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
    if (!(await Session.has(req.headers.authorization))) {
      void res.code(401).send({
        message: 'Invalid token',
      })
      return
    }
    const mail = await Mail.get({
      sessionToken: req.headers.authorization,
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
