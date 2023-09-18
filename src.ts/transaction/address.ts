import * as ed25519 from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'
import { hexToBytes } from '@noble/hashes/utils'
import { Keypair } from '@solana/web3.js'
import { formatHexAddress, getBase58CheckAddress } from '../address/index.js'
import { TRON_ADDRESS_PREFIX } from '../constants/addresses.js'
import { keccak256_hex, SigningKey } from '../crypto/index.js'
import type { SignatureLike } from '../crypto/index.js'
import { ChainNamespace } from '../providers/network.js'
import { BytesLike } from '../utils/index.js'

ed25519.utils.sha512Sync = (...m) => sha512(ed25519.utils.concatBytes(...m))

/**
 *  Returns the address for the %%key%%.
 *
 *  The key may be any standard form of public key or a private key.
 */
export function computeAddress(key: string | SigningKey, chainNamespace: ChainNamespace): string {
  let pubkey: string
  if (typeof key === 'string') {
    pubkey = SigningKey.computePublicKey(key, false)
  } else {
    pubkey = key.publicKey
  }
  const addressHex = keccak256_hex('0x' + pubkey.substring(4)).substring(26)
  if (chainNamespace === ChainNamespace.eip155) return formatHexAddress(addressHex)
  else if (chainNamespace === ChainNamespace.solana) {
    key = key as SigningKey
    const privateKey = key.privateKey
    const privateKeyBytes = hexToBytes(privateKey.substring(2))
    const computedPublicKey = ed25519.sync.getPublicKey(privateKeyBytes).subarray(0, 32)
    const secretKey = new Uint8Array([...privateKeyBytes, ...computedPublicKey])
    return Keypair.fromSecretKey(secretKey).publicKey.toBase58()
  } else if (chainNamespace === ChainNamespace.tron) return getBase58CheckAddress('0x' + TRON_ADDRESS_PREFIX + addressHex)

  throw new Error(`Chain namespace ${chainNamespace} is not supported`)
}

/**
 *  Returns the recovered address for the private key that was
 *  used to sign %%digest%% that resulted in %%signature%%.
 */
export function recoverAddress(digest: BytesLike, signature: SignatureLike, chainNamespace: ChainNamespace): string {
  return computeAddress(SigningKey.recoverPublicKey(digest, signature), chainNamespace)
}
