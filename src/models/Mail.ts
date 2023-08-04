import { parseHeader } from 'imap'
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  .transform((v) => v[0]!)

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
  flags: string[]
}

type Criteria = Array<string | Criteria>

type GetAllMailParams = {
  sessionToken: string
  box?: string
  page?: number
  perPage?: number
  criteria?: Criteria
}

type GetMailParams = {
  sessionToken: string
  box?: string
  id: number
  markSeen?: boolean
  format?: 'html' | 'text'
}

type UpdateArray<T> =
  | T[]
  | {
      add?: T[]
      remove?: T[]
    }

type UpdateMailParams = {
  sessionToken: string
  box?: string
  id: number

  newBox?: {
    location: string | string[]
    action: 'copy' | 'move'
  }
  flags?: UpdateArray<string>
  keywords?: UpdateArray<string>
}

export type MailProperties = {
  id: number
  from: string
  to: string[]
  subject: string
  date: Date
  body: string
  flags: string[]
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
  public readonly flags: string[]

  private constructor({
    id,
    from,
    to,
    subject,
    date,
    body,
    flags,
  }: MailConstructorParams) {
    this.id = id
    this.from = from
    this.to = to
    this.subject = subject
    this.date = date
    this.body = body
    this.flags = flags
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

        session.imap.search(params.criteria ?? ['ALL'], (_, uids) => {
          const perPage = params.perPage ?? Infinity
          const page = params.page ?? 1
          const filteredUids =
            uids.length > perPage
              ? uids.slice((page - 1) * perPage, page * perPage)
              : uids
          const f = session.imap.fetch(filteredUids, {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            markSeen: false,
            // struct: true,
          })
          const mails: Mail[] = []
          f.on('message', (msg) => {
            let headers: z.infer<typeof mailHeaderSchema> | undefined
            let attributes: { uid: number; flags: string[] } | undefined
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
                  headers = parsedHeader.data
                }
              })
            })

            msg.on('attributes', (attrs) => {
              attributes = attrs
            })

            msg.once('end', () => {
              if (headers === undefined || attributes === undefined) {
                return
              }
              const mail = new Mail({
                id: attributes.uid,
                from: headers.from,
                to: headers.to
                  .flatMap((t) => t.split(','))
                  .map((t) => t.trim()),
                subject: headers.subject,
                date: headers.date,
                body: '',
                flags: attributes.flags,
              })
              mails.push(mail)
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
        const f = session.imap.fetch([params.id], {
          // bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
          bodies: '',
          markSeen: params.markSeen ?? false,
          struct: true,
        })
        f.on('message', (msg) => {
          const mailParser = new MailParser()

          let body: string | undefined
          let headers: z.infer<typeof mailHeaderSchema> | undefined
          let attributes: { uid: number; flags: string[] } | undefined

          mailParser.on('headers', (headersData) => {
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

          msg.on('body', (stream) => {
            stream.pipe(mailParser)
          })

          msg.on('attributes', (attrs) => {
            attributes = attrs
          })

          const streamsPromises = [msg, mailParser].map(
            async (stream) =>
              await new Promise((resolve) => {
                stream.once('end', () => {
                  resolve(stream)
                })
              }),
          )

          void Promise.all(streamsPromises).then(() => {
            if (
              headers === undefined ||
              attributes === undefined ||
              body === undefined
            ) {
              reject(new Error('Invalid header'))
              return
            }
            resolve(
              new Mail({
                id: attributes.uid,
                from: headers.from,
                to: headers.to,
                subject: headers.subject,
                date: headers.date,
                body,
                flags: attributes.flags,
              }),
            )
            session.imap.closeBox((err) => {
              if (err !== undefined) {
                reject(err)
              }
            })
          })
        })
      })
    })
  }

  public static async update(params: UpdateMailParams): Promise<Mail> {
    const session = await Session.get(params.sessionToken)
    if (session === undefined) {
      throw new Error('Invalid token')
    }
    const mail = await Mail.get({
      sessionToken: params.sessionToken,
      box: params.box ?? 'INBOX',
      id: params.id,
    })

    return await new Promise((resolve, reject) => {
      session.imap.openBox(params.box ?? 'INBOX', false, (err) => {
        if (err !== undefined) {
          reject(err)
          return
        }
        let flags = mail.flags
        if (params.flags !== undefined) {
          if (Array.isArray(params.flags)) {
            flags = params.flags
            if (flags.length === 0) {
              console.log(params.id, mail.flags)
              session.imap.delFlags(params.id, mail.flags, (err) => {
                if (err !== undefined) {
                  reject(err)
                }
              })
            } else {
              session.imap.setFlags(params.id, params.flags, (err) => {
                if (err !== undefined) {
                  reject(err)
                }
              })
            }
          } else {
            if (params.flags.add !== undefined) {
              const parsedFlags = params.flags.add.map(
                (f) => `\\${capitalize(f)}`,
              )
              flags = Array.from(new Set(flags.concat(parsedFlags)))
              session.imap.addFlags(params.id, parsedFlags, (err) => {
                if (err !== undefined) {
                  reject(err)
                }
              })
            }
            if (params.flags.remove !== undefined) {
              flags = flags.filter((f) =>
                (params.flags as { add: string[] }).add.includes(f),
              )
              session.imap.delFlags(params.id, params.flags.remove, (err) => {
                if (err !== undefined) {
                  reject(err)
                }
              })
            }
          }
        }
        if (params.keywords !== undefined) {
          if (Array.isArray(params.keywords)) {
            session.imap.setKeywords(params.id, params.keywords, (err) => {
              if (err !== undefined) {
                reject(err)
              }
            })
          } else {
            if (params.keywords.add !== undefined) {
              session.imap.addKeywords(
                params.id,
                params.keywords.add,
                (err) => {
                  if (err !== undefined) {
                    reject(err)
                  }
                },
              )
            }
            if (params.keywords.remove !== undefined) {
              session.imap.delKeywords(
                params.id,
                params.keywords.remove,
                (err) => {
                  if (err !== undefined) {
                    reject(err)
                  }
                },
              )
            }
          }
        }
        if (params.newBox !== undefined) {
          const locations =
            typeof params.newBox.location === 'string'
              ? [params.newBox.location]
              : params.newBox.location
          switch (params.newBox.action) {
            case 'copy':
              for (const location of locations) {
                session.imap.copy(params.id, location, (err) => {
                  if (err !== undefined) {
                    reject(err)
                  }
                })
              }
              break

            case 'move':
              if (Array.isArray(params.newBox.location)) {
                throw new Error(
                  'Mail can be move at only one location at a time',
                )
              }
              session.imap.move(params.id, params.newBox.location, (err) => {
                if (err !== undefined) {
                  reject(err)
                }
              })
              break
          }
        }
        resolve(
          new Mail({
            id: mail.id,
            from: mail.from,
            to: mail.to,
            subject: mail.subject,
            date: mail.date,
            body: mail.body,
            flags,
          }),
        )
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
      flags: this.flags,
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

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default Mail
