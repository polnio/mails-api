import Session from './Session'
import { parseHeader } from 'imap'
import { z } from 'zod'

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

interface MailConstructorParams {
  id: number
  from: string
  to: string[]
  subject: string
  date: Date
  body: string
}

interface GetAllMailParams {
  sessionToken: string
  box?: string
  limit?: number
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
        const f = session.imap.seq.fetch(
          params.limit !== undefined ? `1:${params.limit}` : `1:*`,
          {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            markSeen: false,
            struct: true,
          },
        )
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
}

export default Mail
