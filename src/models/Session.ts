import Imap from 'imap'
import nodemailer, { type Transporter } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import { v4 as uuid } from 'uuid'

interface SessionConstructorParams {
  token: string
  email: string
  imap: Imap
  smtp: Transporter
}

interface Credentials {
  email: string
  password: string
  imap: {
    host: string
    port: number
  }
  smtp: {
    host: string
    port: number
  }
}

class Session {
  private static readonly instances: Session[] = []

  private readonly email: string

  public readonly imap: Imap
  public readonly smtp: Transporter<SMTPTransport.SentMessageInfo>
  public readonly token: string

  private constructor({ token, email, imap, smtp }: SessionConstructorParams) {
    this.token = token
    this.email = email
    this.imap = imap
    this.smtp = smtp
  }

  public static async get(token: string): Promise<Session | undefined> {
    return Session.instances.find((connection) => connection.token === token)
  }

  public static async has(token: string): Promise<boolean> {
    return Session.instances.some((connection) => connection.token === token)
  }

  public static async connect(credentials: Credentials): Promise<Session> {
    return (
      Session.instances.find(
        (connection) => connection.email === credentials.email,
      ) ?? (await Session.create(credentials))
    )
  }

  public static async create(credentials: Credentials): Promise<Session> {
    let token: string
    const imapPromise = new Promise<Imap>((resolve, reject) => {
      const imap = new Imap({
        user: credentials.email,
        password: credentials.password,
        host: credentials.imap.host,
        port: credentials.imap.port,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      })
      imap.once('ready', () => {
        resolve(imap)
      })
      imap.once('error', (err: unknown) => {
        reject(err)
      })
      imap.connect()
    })
    const smtpPromise = new Promise<Transporter<SMTPTransport.SentMessageInfo>>(
      (resolve, reject) => {
        const smtp = nodemailer.createTransport({
          host: credentials.smtp.host,
          port: credentials.smtp.port,
          secure: true,
          auth: {
            user: credentials.email,
            pass: credentials.password,
          },
        })
        smtp.verify((error) => {
          if (error !== null) {
            reject(error)
          } else {
            resolve(smtp)
          }
        })
      },
    )

    const [imap, smtp] = await Promise.all([imapPromise, smtpPromise])

    do {
      token = uuid()
    } while (Session.instances.some((connection) => connection.token === token))

    const session = new Session({
      token,
      email: credentials.email,
      imap,
      smtp,
    })
    Session.instances.push(session)
    return session
  }

  public static async destroy(token: string): Promise<void> {
    const connection = Session.instances.find(
      (connection) => connection.token === token,
    )
    if (connection !== undefined) {
      connection.imap.end()
      Session.instances.splice(Session.instances.indexOf(connection))
    }
  }

  public static async destroyAll(): Promise<void> {
    await Promise.all(
      Session.instances.map(async (connection) => {
        await Session.destroy(connection.token)
      }),
    )
  }
}

export default Session
