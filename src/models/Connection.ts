import { v4 as uuid } from 'uuid'

interface ConnectionConstructorParams {
  token: string
  email: string
}

interface Credentials {
  email: string
  password: string
}

class Connection {
  private static readonly instances: Connection[] = []

  private readonly email: string
  public readonly token: string

  private constructor({ token, email }: ConnectionConstructorParams) {
    this.token = token
    this.email = email
  }

  public static getAll(): Connection[] {
    return Connection.instances
  }

  public static async connect(credentials: Credentials): Promise<Connection> {
    return (
      Connection.instances.find(
        (connection) => connection.email === credentials.email,
      ) ?? (await Connection.create(credentials))
    )
  }

  public static async create(credentials: Credentials): Promise<Connection> {
    const token = uuid()
    for (const connection of Connection.instances) {
      if (connection.token === token) {
        await Connection.destroy(token)
      }
    }
    const connection = new Connection({ token, email: credentials.email })
    Connection.instances.push(connection)
    return connection
  }

  public static async destroy(token: string): Promise<void> {
    const index = Connection.instances.findIndex(
      (connection) => connection.token === token,
    )
    if (index === -1) {
      return
    }
    Connection.instances.splice(index, 1)
  }
}

export default Connection
