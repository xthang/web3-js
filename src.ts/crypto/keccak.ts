/**
 *  Cryptographic hashing functions
 *
 *  @_subsection: api/crypto:Hash Functions [about-crypto-hashing]
 */

import { keccak_256 } from '@noble/hashes/sha3'

import { getBytes, hexlify } from '../utils/index.js'
import type { BytesLike } from '../utils/index.js'

let locked = false

const _keccak256 = function (data: Uint8Array): Uint8Array {
  return keccak_256(data)
}

let __keccak256: (data: Uint8Array) => Uint8Array = _keccak256

export function keccak256(_data: BytesLike): Uint8Array {
  const data = getBytes(_data, 'data')
  return __keccak256(data)
}

/**
 *  Compute the cryptographic KECCAK256 hash of %%data%%.
 *
 *  The %%data%% **must** be a data representation, to compute the
 *  hash of UTF-8 data use the [[id]] function.
 *
 *  @returns DataHexstring
 *  @example:
 *    keccak256_hex("0x")
 *    //_result:
 *
 *    keccak256_hex("0x1337")
 *    //_result:
 *
 *    keccak256_hex(new Uint8Array([ 0x13, 0x37 ]))
 *    //_result:
 *
 *    // Strings are assumed to be DataHexString, otherwise it will
 *    // throw. To hash UTF-8 data, see the note above.
 *    keccak256_hex("Hello World")
 *    //_error:
 */
export function keccak256_hex(_data: BytesLike): string {
  return hexlify(keccak256(_data))
}
keccak256._ = _keccak256
keccak256.lock = function (): void {
  locked = true
}
keccak256.register = function (func: (data: Uint8Array) => Uint8Array) {
  if (locked) {
    throw new TypeError('keccak256 is locked')
  }
  __keccak256 = func
}
Object.freeze(keccak256)
