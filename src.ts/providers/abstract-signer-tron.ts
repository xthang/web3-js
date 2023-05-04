/**
 *  About Abstract Signer and subclassing
 *
 *  @_section: api/providers/abstract-signer: Subclassing Signer [abstract-signer]
 */
import { resolveAddress } from '../address/index'
import type { TransactionLike } from '../transaction/index'
import { resolveProperties, assertArgument } from '../utils/index'
import { copyRequest } from './provider'
import type { Provider, TransactionRequest } from './provider'
import { TronProvider } from './provider-tron'
import { AbstractSigner } from './index'

async function populate(signer: AbstractTronSigner, tx: TransactionRequest): Promise<TransactionLike<string>> {
  const pop: any = copyRequest(tx)

  if (pop.to != null) {
    pop.to = resolveAddress(pop.to, signer.provider!.chainNamespace, signer)
  }

  if (pop.from != null) {
    const from = pop.from
    pop.from = Promise.all([signer.getAddress(), resolveAddress(from, signer.provider!.chainNamespace, signer)]).then(([address, from]) => {
      assertArgument(address.toLowerCase() === from.toLowerCase(), 'transaction from mismatch', 'tx.from', from)
      return address
    })
  } else {
    pop.from = signer.getAddress()
  }

  return await resolveProperties(pop)
}

export abstract class AbstractTronSigner<P extends null | TronProvider = null | TronProvider> extends AbstractSigner<P> {
  async populateCall(tx: TransactionRequest): Promise<TransactionLike<string>> {
    const pop = await populate(this, tx)
    return pop
  }

  async populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>> {
    const pop = await populate(this, tx)

    if (pop.gasLimit == null) {
      pop.gasLimit = await this.estimateGas(pop)
    }

    // Populate the chain ID
    const network = await (<Provider>this.provider).getNetwork()
    if (pop.chainId != null) {
      const chainId = BigInt(pop.chainId)
      assertArgument(chainId === network.chainId, 'transaction chainId mismatch', 'tx.chainId', tx.chainId)
    } else {
      pop.chainId = network.chainId
    }

    //@TOOD: Don't await all over the place; save them up for
    // the end for better batching
    return await resolveProperties(pop)
  }
}
