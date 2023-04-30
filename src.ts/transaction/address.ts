import { formatHexAddress, getBase58CheckAddress } from "../address/index";
import { TRON_ADDRESS_PREFIX } from "../constants/addresses";
import { keccak256_hex, SigningKey } from "../crypto/index";
import type { SignatureLike } from "../crypto/index";
import { ChainNamespace } from "../providers/network";
import { BytesLike } from "../utils/index";

/**
 *  Returns the address for the %%key%%.
 *
 *  The key may be any standard form of public key or a private key.
 */
export function computeAddress(key: string | SigningKey, chainNamespace: ChainNamespace): string {
    let pubkey: string;
    if (typeof (key) === "string") {
        pubkey = SigningKey.computePublicKey(key, false);
    } else {
        pubkey = key.publicKey;
    }
    const addressHex = keccak256_hex("0x" + pubkey.substring(4)).substring(26)
    if (chainNamespace === ChainNamespace.eip155)
        return formatHexAddress(addressHex)
    else if (chainNamespace === ChainNamespace.solana)
        return getBase58CheckAddress("0x" + TRON_ADDRESS_PREFIX + addressHex)
    else if (chainNamespace === ChainNamespace.tron)
        return getBase58CheckAddress("0x" + TRON_ADDRESS_PREFIX + addressHex)

    throw new Error(`Chain namespace ${chainNamespace} is not supported`)
}

/**
 *  Returns the recovered address for the private key that was
 *  used to sign %%digest%% that resulted in %%signature%%.
 */
export function recoverAddress(digest: BytesLike, signature: SignatureLike, chainNamespace: ChainNamespace): string {
    return computeAddress(SigningKey.recoverPublicKey(digest, signature), chainNamespace);
}
