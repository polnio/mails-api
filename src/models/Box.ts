import { type MailBoxes } from 'imap'
import Session from './Session'

type GetBoxesParams = {
  sessionToken: string
}

type GetBoxParams = {
  sessionToken: string
  name: string
}

type PostBoxParams = {
  sessionToken: string
  fullName: string
}

type PatchBoxParams = {
  sessionToken: string
  name: string
  newName?: string
}

type DeleteBoxParams = {
  sessionToken: string
  name: string
}

type BoxConstructorParams = {
  name: string
  flags?: string[]
  delimiter?: string
  children?: Box[]
  parent?: Box | undefined
}

export type JsonBox = {
  name: string
  flags: string[]
  delimiter: string
  children: JsonBox[]
}

class Box {
  public readonly name: string
  public readonly flags: string[]
  public readonly delimiter: string
  public readonly children: Box[]
  private _parent: Box | undefined

  public get parent(): Box | undefined {
    return this._parent
  }

  private set parent(value: Box | undefined) {
    this._parent = value
  }

  public get fullName(): string {
    if (this.parent === undefined) {
      return this.name
    }
    return this.parent.fullName + this.delimiter + this.name
  }

  public constructor({
    name,
    flags,
    delimiter,
    children,
    parent,
  }: BoxConstructorParams) {
    this.name = name
    this.flags = flags ?? []
    this.delimiter = delimiter ?? '/'
    this.children = children ?? []
    this._parent = parent
  }

  public static async getAll(params: GetBoxesParams): Promise<Box[]> {
    const session = await Session.get(params.sessionToken)
    if (session === undefined) {
      return []
    }
    return await new Promise((resolve, reject) => {
      session.imap.getBoxes((err, boxes) => {
        if (err !== undefined) {
          reject(err)
        }
        resolve(Box.fromImapBoxes(boxes))
      })
    })
  }

  public static async get(params: GetBoxParams): Promise<Box | undefined> {
    const boxes = await Box.getAll({ sessionToken: params.sessionToken })
    for (const box of boxes) {
      const maybeBox = box.findBox(params.name)
      if (maybeBox !== undefined) {
        return maybeBox
      }
    }
    return undefined
  }

  public static async create(params: PostBoxParams): Promise<void> {
    const session = await Session.get(params.sessionToken)
    if (session === undefined) {
      return
    }
    session.imap.addBox(params.fullName, (err) => {
      if (err !== undefined) {
        throw err
      }
    })
  }

  public static async update(params: PatchBoxParams): Promise<void> {
    const session = await Session.get(params.sessionToken)
    if (session === undefined) {
      return
    }
    if (params.newName !== undefined) {
      session.imap.renameBox(params.name, params.newName, (err) => {
        if (err !== undefined) {
          throw err
        }
      })
    }
  }

  public static async delete(params: DeleteBoxParams): Promise<void> {
    const session = await Session.get(params.sessionToken)
    if (session === undefined) {
      return
    }
    session.imap.delBox(params.name, (err) => {
      if (err !== undefined) {
        throw err
      }
    })
  }

  private findBox(name: string): Box | undefined {
    if (this.fullName === name) {
      return this
    }
    if (name.startsWith(this.fullName)) {
      for (const child of this.children) {
        const childBox = child.findBox(name)
        if (childBox !== undefined) {
          return childBox
        }
      }
    }
    return undefined
  }

  private static fromImapBoxes(
    imapBoxes: MailBoxes,
    allBoxes: Box[] = [],
  ): Box[] {
    return Object.entries(imapBoxes).map(([name, data]) => {
      const box = new Box({
        name,
        flags: data.attribs,
        delimiter: data.delimiter,
        children:
          data.children !== null
            ? Box.fromImapBoxes(data.children, allBoxes)
            : [],
        parent: undefined,
      })
      allBoxes.push(box)
      for (const child of box.children) {
        child.parent = box
      }
      return box
    })
    /* const boxes: Box[] = []
    for (const [name, data] of Object.entries(imapBoxes)) {
      boxes.push(
        new Box({
          name,
          flags: data.attribs,
          delimiter: data.delimiter,
          children:
            data.children !== null
              ? Box.fromImapBoxes(data.children, allBoxes)
              : [],
          parent: allBoxes.find((box) =>
            box.children.some((child) => child.name === name),
          ),
        }),
      )
    }
    return boxes */
  }

  public toJson(): JsonBox {
    return {
      name: this.name,
      flags: this.flags,
      delimiter: this.delimiter,
      children: this.children.map((child) => child.toJson()),
    }
  }
}

export default Box
