import { convertToHexAddress, formatHexAddress } from '../../address/index.js'
import { ChainNamespace } from '../../providers/index.js'
import { toBeHex } from '../../utils/maths.js'
import { Typed } from '../typed.js'
import { Coder } from './abstract-coder.js'
import type { Reader, Writer } from './abstract-coder.js'

/**
 *  @_ignore
 */
export class AddressCoder extends Coder {
  readonly #chainNamespace: ChainNamespace

  constructor(chainNamespace: ChainNamespace, localName: string) {
    super('address', 'address', localName, false)

    this.#chainNamespace = chainNamespace
  }

  defaultValue(): string {
    return '0x0000000000000000000000000000000000000000'
  }

  encode(writer: Writer, _value: string | Typed): number {
    let value = Typed.dereference(_value, 'string')
    try {
      value = convertToHexAddress(value, this.#chainNamespace)
    } catch (error: any) {
      return this._throwError(error.message, _value)
    }
    return writer.writeValue(value)
  }

  decode(reader: Reader): any {
    return formatHexAddress(toBeHex(reader.readValue(), 20))
  }
}
