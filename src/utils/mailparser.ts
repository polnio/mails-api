import { type HeaderValue } from 'mailparser'

/* function personInfoToAddress(personInfo: PersonInfo): string {
  if (personInfo.name === '') {
    return personInfo.address
  }
  return `${personInfo.name} <${personInfo.address}>`
}
*/
function parseHeaderValueToString(header: HeaderValue): string {
  if (typeof header === 'string') {
    return header
  }
  if (Array.isArray(header)) {
    return header.join(', ')
  }
  if ('text' in header) {
    return header.text
  }
  if ('value' in header) {
    return header.value
  }
  if (header instanceof Date) {
    return header.toISOString()
  }
  // ? Never
  throw new Error('Incompatible type')
}

function parseHeaderValueToArray(header: HeaderValue): string[] {
  if (typeof header === 'string') {
    return [header]
  }
  if (Array.isArray(header)) {
    return header
  }
  if ('text' in header) {
    return [header.text]
  }
  if ('value' in header) {
    return [header.value]
  }
  if (header instanceof Date) {
    return [header.toISOString()]
  }
  // ? Never
  throw new Error('Incompatible type')
}

function parseHeaderValueToDate(header: HeaderValue): Date {
  if (typeof header === 'string') {
    return new Date(header)
  }
  if (Array.isArray(header)) {
    return new Date(header[0] ?? '')
  }
  if ('text' in header) {
    return new Date(header.text)
  }
  if ('value' in header) {
    return new Date(header.value)
  }
  if (header instanceof Date) {
    return header
  }
  // ? Never
  throw new Error('Incompatible type')
}

export {
  // personInfoToAddress,
  parseHeaderValueToString,
  parseHeaderValueToArray,
  parseHeaderValueToDate,
}
