
import { Interface } from "../abi/index";
import { getCreateAddress } from "../address/index";
import {
    concat, defineProperties, getBytes, hexlify,
    assert, assertArgument
} from "../utils/index";

import { BaseContract, copyOverrides, resolveArgs } from "./contract";

import type { InterfaceAbi } from "../abi/index";
import type { ChainNamespace, ContractRunner } from "../providers/index";
import type { BytesLike } from "../utils/index";

import type {
    ContractInterface, ContractMethodArgs, ContractDeployTransaction,
} from "./types";
import type { ContractTransactionResponse } from "./wrappers";


// A = Arguments to the constructor
// I = Interface of deployed contracts
export class ContractFactory<A extends Array<any> = Array<any>, I = BaseContract> {
    readonly interface!: Interface;
    readonly bytecode!: string;
    readonly runner!: null | ContractRunner;

    constructor(chainNamespace: ChainNamespace, abi: Interface | InterfaceAbi, bytecode: BytesLike | { object: string }, runner?: null | ContractRunner) {
        const iface = Interface.from(chainNamespace, abi);

        // Dereference Solidity bytecode objects and allow a missing `0x`-prefix
        if (bytecode instanceof Uint8Array) {
            bytecode = hexlify(getBytes(bytecode));
        } else {
            if (typeof(bytecode) === "object") { bytecode = bytecode.object; }
            if (!bytecode.startsWith("0x")) { bytecode = "0x" + bytecode; }
            bytecode = hexlify(getBytes(bytecode));
        }

        defineProperties<ContractFactory>(this, {
            bytecode, interface: iface, runner: (runner || null)
        });
    }

    async getDeployTransaction(...args: ContractMethodArgs<A>): Promise<ContractDeployTransaction> {
        let overrides: Omit<ContractDeployTransaction, "data"> = { };

        const fragment = this.interface.deploy;

        if (fragment.inputs.length + 1 === args.length) {
            overrides = await copyOverrides(args.pop());
        }

        if (fragment.inputs.length !== args.length) {
            throw new Error("incorrect number of arguments to constructor");
        }

        const resolvedArgs = await resolveArgs(this.runner, fragment.inputs, args);

        const data = concat([ this.bytecode, this.interface.encodeDeploy(resolvedArgs) ]);
        return Object.assign({ }, overrides, { data });
    }

    async deploy(...args: ContractMethodArgs<A>): Promise<BaseContract & { deploymentTransaction(): ContractTransactionResponse } & Omit<I, keyof BaseContract>> {
        const tx = await this.getDeployTransaction(...args);

        assert(this.runner && typeof(this.runner.sendTransaction) === "function",
            "factory runner does not support sending transactions", "UNSUPPORTED_OPERATION", {
            operation: "sendTransaction" });

        const sentTx = await this.runner.sendTransaction(tx);
        const address = getCreateAddress(sentTx);
        return new (<any>BaseContract)(address, this.interface, this.runner, sentTx);
    }

    connect(runner: null | ContractRunner): ContractFactory<A, I> {
        return new ContractFactory(this.interface.chainNamespace, this.interface, this.bytecode, runner);
    }

    static fromSolidity<A extends Array<any> = Array<any>, I = ContractInterface>(chainNamespace: ChainNamespace, output: any, runner?: ContractRunner): ContractFactory<A, I> {
        assertArgument(output != null, "bad compiler output", "output", output);

        if (typeof(output) === "string") { output = JSON.parse(output); }

        const abi = output.abi;

        let bytecode = "";
        if (output.bytecode) {
            bytecode = output.bytecode;
        } else if (output.evm && output.evm.bytecode) {
            bytecode = output.evm.bytecode;
        }

        return new this(chainNamespace, abi, bytecode, runner);
    }
}
