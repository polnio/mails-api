import Imap from 'imap'
import { v4 as uuid } from 'uuid'

interface SessionConstructorParams {
  token: string
  email: string
  imap: Imap
}

interface Credentials {
  email: string
  password: string
  imap: {
    host: string
    port: number
  }
}

class Session {
  private static readonly instances: Session[] = []

  private readonly email: string

  public readonly imap: Imap
  public readonly token: string

  private constructor({ token, email, imap }: SessionConstructorParams) {
    this.token = token
    this.email = email
    this.imap = imap
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
    do {
      token = uuid()
    } while (Session.instances.some((connection) => connection.token === token))
    const [imap] = await Promise.all([imapPromise])
    const session = new Session({
      token,
      email: credentials.email,
      imap,
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
