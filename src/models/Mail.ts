import { parseHeader } from 'imap'
// import util from 'util'
import { MailParser } from 'mailparser'
import { z } from 'zod'
import Session from './Session'
import { type Stream } from 'stream'
import {
  parseHeaderValueToArray,
  parseHeaderValueToDate,
  parseHeaderValueToString,
} from '@/utils/mailparser'

const arrayToStringSchema = z
  .array(z.string())
  .min(1)
  .transform((v) => v[0])

const mailHeaderSchema = z.object({
  from: arrayToStringSchema,
  to: z.array(z.string()).min(1),
  subject: arrayToStringSchema,
  date: arrayToStringSchema.transform((date) => new Date(date)),
})

type MailConstructorParams = {
  id: number
  from: string
  to: string[]
  subject: string
  date: Date
  body: string
}

type GetAllMailParams = {
  sessionToken: string
  box?: string
}

type GetMailParams = {
  sessionToken: string
  box?: string
  id: number
  markSeen?: boolean
  format?: 'html' | 'text'
}

export type MailProperties = {
  id: number
  from: string
  to: string[]
  subject: string
  date: Date
  body: string
}

export type MailJson = {
  id: number
  from: string
  to: string[]
  subject: string
  date: string
  body: string
}

class Mail {
  public readonly id: number
  public readonly from: string
  public readonly to: string[]
  public readonly subject: string
  public readonly date: Date
  public readonly body: string

  private constructor({
    id,
    from,
    to,
    subject,
    date,
    body,
  }: MailConstructorParams) {
    this.id = id
    this.from = from
    this.to = to
    this.subject = subject
    this.date = date
    this.body = body
  }

  public static async getAll(params: GetAllMailParams): Promise<Mail[]> {
    const session = await Session.get(params.sessionToken)
    if (session === undefined) {
      return []
    }
    return await new Promise((resolve, reject) => {
      session.imap.openBox(params.box ?? 'INBOX', true, (err) => {
        if (err !== undefined) {
          reject(err)
        }
        const f = session.imap.seq.fetch('1:*', {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          markSeen: false,
          struct: true,
        })
        const mails: Mail[] = []
        f.on('message', (msg, id) => {
          msg.on('body', (stream) => {
            let buffer = ''
            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString('utf8')
            })
            stream.once('end', () => {
              const parsedHeader = mailHeaderSchema.safeParse(
                parseHeader(buffer),
              )
              if (parsedHeader.success) {
                const mail = new Mail({
                  id,
                  from: parsedHeader.data.from,
                  to: parsedHeader.data.to
                    .flatMap((t) => t.split(','))
                    .map((t) => t.trim()),
                  subject: parsedHeader.data.subject,
                  date: parsedHeader.data.date,
                  body: buffer,
                })
                mails.push(mail)
              }
            })
          })
        })
        f.once('error', (err) => {
          reject(err)
        })
        f.once('end', () => {
          resolve(mails)
        })
      })
    })
  }

  public static async get(params: GetMailParams): Promise<Mail> {
    const session = await Session.get(params.sessionToken)
    if (session === undefined) {
      throw new Error('Invalid token')
    }
    return await new Promise((resolve, reject) => {
      session.imap.openBox(params.box ?? 'INBOX', true, (err) => {
        if (err !== undefined) {
          reject(err)
          return
        }
        const f = session.imap.seq.fetch(params.id.toString(), {
          // bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
          bodies: '',
          markSeen: params.markSeen ?? false,
          struct: true,
        })
        f.on('message', (msg) => {
          const mailParser = new MailParser()

          let body: string
          let headers: z.infer<typeof mailHeaderSchema>
          msg.on('body', (stream, info) => {
            stream.pipe(mailParser)

            mailParser.on('headers', (headersData) => {
              // console.log(util.inspect(headersData, false, 22, true))
              const from = headersData.get('from')
              const to = headersData.get('to')
              const subject = headersData.get('subject')
              const date = headersData.get('date')

              if (
                from === undefined ||
                to === undefined ||
                subject === undefined ||
                date === undefined
              ) {
                reject(new Error('Invalid header'))
                return
              }

              headers = {
                from: parseHeaderValueToString(from),
                to: parseHeaderValueToArray(to),
                subject: parseHeaderValueToString(subject),
                date: parseHeaderValueToDate(date),
              }
            })

            mailParser.on(
              'data',
              (
                data:
                  | {
                      type: 'text'
                      text: string
                      html?: string | undefined
                      textAsHtml: string
                    }
                  | {
                      type: 'attachment'
                      filename: string
                      content: Stream
                      release: () => void
                    },
              ) => {
                console.log(data)
                if (data.type === 'text') {
                  if (params.format === 'html') {
                    body = data.html ?? data.textAsHtml
                  } else {
                    body = data.text
                  }
                }
                if (data.type === 'attachment') {
                  data.release()
                }
              },
            )

            mailParser.on('end', () => {
              // console.log(body)
              resolve(
                new Mail({
                  id: params.id,
                  from: headers.from,
                  to: headers.to,
                  subject: headers.subject,
                  date: headers.date,
                  body,
                }),
              )
            })
            /* stream.pipe(process.stdout)
            let buffer = ''
            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString('utf8')
            })
            stream.once('end', () => {
              if (info.which === 'TEXT') {
                body = buffer
              } else {
                const parsedHeader = mailHeaderSchema.safeParse(
                  parseHeader(buffer),
                )
                if (parsedHeader.success) {
                  headers = parsedHeader.data
                }
              }
            }) */
          })
          /* msg.once('end', () => {
            resolve(
              new Mail({
                id: params.id,
                from: headers.from,
                to: headers.to,
                subject: headers.subject,
                date: headers.date,
                body,
              }),
            )
          }) */
        })
      })
    })
  }

  public getProperties(): MailProperties {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      subject: this.subject,
      date: this.date,
      body: this.body,
    }
  }

  public toJson(): MailJson {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      subject: this.subject,
      date: this.date.toString(),
      body: this.body,
    }
  }
}

export default Mail
