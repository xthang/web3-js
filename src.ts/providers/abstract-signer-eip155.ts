/**
 *  About Abstract Signer and subclassing
 *
 *  @_section: api/providers/abstract-signer: Subclassing Signer [abstract-signer]
 */
import { resolveAddress } from "../address/index";
import type { TypedDataDomain, TypedDataField } from "../hash/index";
import { TransactionLike } from "../transaction/index";
import {
    defineProperties, resolveProperties,
    assert, assertArgument
} from "../utils/index";
import { copyRequest } from "./provider";
import type { BlockTag, Provider, TransactionRequest } from "./provider";
import { AbstractSigner } from "./index";


function checkProvider(signer: AbstractEip155Signer, operation: string): Provider {
    if (signer.provider) { return signer.provider; }
    assert(false, "missing provider", "UNSUPPORTED_OPERATION", { operation });
}

async function populate(signer: AbstractEip155Signer, tx: TransactionRequest): Promise<TransactionLike<string>> {
    const pop: any = copyRequest(tx);

    if (pop.to != null) { pop.to = resolveAddress(pop.to, signer.provider!.chainNamespace, signer); }

    if (pop.from != null) {
        const from = pop.from;
        pop.from = Promise.all([
            signer.getAddress(),
            resolveAddress(from, signer.provider!.chainNamespace, signer)
        ]).then(([address, from]) => {
            assertArgument(address.toLowerCase() === from.toLowerCase(),
                "transaction from mismatch", "tx.from", from);
            return address;
        });
    } else {
        pop.from = signer.getAddress();
    }

    return await resolveProperties(pop);
}


export abstract class AbstractEip155Signer<P extends null | Provider = null | Provider> extends AbstractSigner<P> {
    async getNonce(blockTag?: BlockTag): Promise<number> {
        return checkProvider(this, "getTransactionCount").getTransactionCount(await this.getAddress(), blockTag);
    }

    async populateCall(tx: TransactionRequest): Promise<TransactionLike<string>> {
        const pop = await populate(this, tx);
        return pop;
    }

    async populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>> {
        const provider = checkProvider(this, "populateTransaction");

        const pop = await populate(this, tx);

        if (pop.nonce == null) {
            pop.nonce = await this.getNonce("pending");
        }

        if (pop.gasLimit == null) {
            pop.gasLimit = await this.estimateGas(pop);
        }

        // Populate the chain ID
        const network = await (<Provider>(this.provider)).getNetwork();
        if (pop.chainId != null) {
            const chainId = BigInt(pop.chainId);
            assertArgument(chainId === network.chainId, "transaction chainId mismatch", "tx.chainId", tx.chainId);
        } else {
            pop.chainId = network.chainId;
        }

        // Do not allow mixing pre-eip-1559 and eip-1559 properties
        const hasEip1559 = (pop.maxFeePerGas != null || pop.maxPriorityFeePerGas != null);
        if (pop.gasPrice != null && (pop.type === 2 || hasEip1559)) {
            assertArgument(false, "eip-1559 transaction do not support gasPrice", "tx", tx);
        } else if ((pop.type === 0 || pop.type === 1) && hasEip1559) {
            assertArgument(false, "pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "tx", tx);
        }

        if ((pop.type === 2 || pop.type == null) && (pop.maxFeePerGas != null && pop.maxPriorityFeePerGas != null)) {
            // Fully-formed EIP-1559 transaction (skip getFeeData)
            pop.type = 2;

        } else if (pop.type === 0 || pop.type === 1) {
            // Explicit Legacy or EIP-2930 transaction

            // We need to get fee data to determine things
            const feeData = await provider.getFeeData();

            assert(feeData.gasPrice != null, "network does not support gasPrice", "UNSUPPORTED_OPERATION", {
                operation: "getGasPrice"
            });

            // Populate missing gasPrice
            if (pop.gasPrice == null) { pop.gasPrice = feeData.gasPrice; }

        } else {

            // We need to get fee data to determine things
            const feeData = await provider.getFeeData();

            if (pop.type == null) {
                // We need to auto-detect the intended type of this transaction...

                if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                    // The network supports EIP-1559!

                    // Upgrade transaction from null to eip-1559
                    pop.type = 2;

                    if (pop.gasPrice != null) {
                        // Using legacy gasPrice property on an eip-1559 network,
                        // so use gasPrice as both fee properties
                        const gasPrice = pop.gasPrice;
                        delete pop.gasPrice;
                        pop.maxFeePerGas = gasPrice;
                        pop.maxPriorityFeePerGas = gasPrice;

                    } else {
                        // Populate missing fee data

                        if (pop.maxFeePerGas == null) {
                            pop.maxFeePerGas = feeData.maxFeePerGas;
                        }

                        if (pop.maxPriorityFeePerGas == null) {
                            pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                        }
                    }

                } else if (feeData.gasPrice != null) {
                    // Network doesn't support EIP-1559...

                    // ...but they are trying to use EIP-1559 properties
                    assert(!hasEip1559, "network does not support EIP-1559", "UNSUPPORTED_OPERATION", {
                        operation: "populateTransaction"
                    });

                    // Populate missing fee data
                    if (pop.gasPrice == null) {
                        pop.gasPrice = feeData.gasPrice;
                    }

                    // Explicitly set untyped transaction to legacy
                    // @TODO: Maybe this shold allow type 1?
                    pop.type = 0;

                } else {
                    // getFeeData has failed us.
                    assert(false, "failed to get consistent fee data", "UNSUPPORTED_OPERATION", {
                        operation: "signer.getFeeData"
                    });
                }

            } else if (pop.type === 2) {
                // Explicitly using EIP-1559

                // Populate missing fee data
                if (pop.maxFeePerGas == null) {
                    pop.maxFeePerGas = feeData.maxFeePerGas;
                }

                if (pop.maxPriorityFeePerGas == null) {
                    pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                }
            }
        }

        //@TOOD: Don't await all over the place; save them up for
        // the end for better batching
        return await resolveProperties(pop);
    }
}

export class VoidSigner extends AbstractEip155Signer {
    readonly address!: string;

    constructor(address: string, provider?: null | Provider) {
        super(provider);
        defineProperties<VoidSigner>(this, { address });
    }

    async getAddress(): Promise<string> { return this.address; }

    connect(provider: null | Provider): VoidSigner {
        return new VoidSigner(this.address, provider);
    }

    #throwUnsupported(suffix: string, operation: string): never {
        assert(false, `VoidSigner cannot sign ${suffix}`, "UNSUPPORTED_OPERATION", { operation });
    }

    async signTransaction(tx: TransactionRequest): Promise<string> {
        this.#throwUnsupported("transactions", "signTransaction");
    }

    async signMessage(message: string | Uint8Array): Promise<string> {
        this.#throwUnsupported("messages", "signMessage");
    }

    async signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
        this.#throwUnsupported("typed-data", "signTypedData");
    }
}

