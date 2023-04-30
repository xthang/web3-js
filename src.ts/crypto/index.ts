/**
 *  A fundamental building block of Ethereum is the underlying
 *  cryptographic primitives.
 *
 *  @_section: api/crypto:Cryptographic Functions   [about-crypto]
 */

null

// We import all these so we can export lock()
import { computeHmac } from "./hmac";
import { keccak256, keccak256_hex } from "./keccak";
import { ripemd160 } from "./ripemd160";
import { pbkdf2 } from "./pbkdf2";
import { randomBytes } from "./random";
import { scrypt, scryptSync } from "./scrypt";
import { sha256, sha512 } from "./sha2";

export {
    computeHmac,

    randomBytes,

    keccak256,
    keccak256_hex,
    ripemd160,
    sha256, sha512,

    pbkdf2,
    scrypt, scryptSync
};

export { SigningKey } from "./signing-key";
export { Signature } from "./signature";

function lock(): void {
    computeHmac.lock();
    keccak256.lock();
    pbkdf2.lock();
    randomBytes.lock();
    ripemd160.lock();
    scrypt.lock();
    scryptSync.lock();
    sha256.lock();
    sha512.lock();
    randomBytes.lock();
}

export { lock };

/////////////////////////////
// Types

export type { ProgressCallback } from "./scrypt";

export type { SignatureLike } from "./signature";
