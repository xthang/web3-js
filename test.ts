import assert from 'assert'
import BufferLayout from '@solana/buffer-layout'
import * as SplToken from '@solana/spl-token'
// import { TokenSwap } from '@solana/spl-token-swap'
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionInstructionCtorFields } from '@solana/web3.js'
import BN from 'bn.js'

import { ChainNamespace, Contract, Interface, SolanaJsonRpcProvider, TransactionResponse, Wallet } from './src.ts'
import { TransactionType as SolanaTransactionType, SolanaWallet } from './src.ts/wallet/wallet-solana'
import { TransactionType as TronTransactionType } from './src.ts/wallet/wallet-tron.ts'

// const address = '0xF555f9e608E4F5d43BD3B38836b5401717c80721'
// const address = '0xcC6c0FC4beaF823365eF9F445f668cdDE35b0F0c'
// const address = 'TJEN1hXp61v5U4imTMjVGFwDifKWcZPMXy'
// const address = 'TVJiKYP9M1Tp5o6yYmkaLUtsKguJo99ooH'
// const address = '2DVaHtcdTf7cm18Zm9VV8rKK4oSnjmTkKE6MiXe18Qsb'
// const address = '9RM3h2a1Azs4Cn84sMGtJbujBSp9igjuRpYH63BKMtju'
const address = '5dvVivApBmDuWUbsPNFPEGZ2FSJtjkY4JU8jcK8FTeZP' // XT's 0xf555f9e608e4f5d43bd3b38836b5401717c80721
// const address = 'C1AhjxZydV1gibKfsDtyiSz4N776t5dMXrLd4jp8aAb8' // XT's 0xcC6c0FC4beaF823365eF9F445f668cdDE35b0F0c

const address_MUMBAI_USDT = '0x8ba7E58bb14e56F5A2A1947C090a9Fcab1f98228'
const address_MAIN_WrappedTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR'
const address_SHASTA_USDT = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs'
const address_SHASTA_USDT_2 = 'TXXLsmZo5yzbwGZLoh7znccamTQyJx6Z74'
const address_SHASTA_USDC = 'TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id'
const address_SHASTA_USDJ = 'TLBaRhANQoJFTqre9Nf1mjuwNWjCJeYqUL'
const address_SHASTA_LFC = 'TXEPrQSjNxZoM8LqKGGZL3yYiFmGodAHVw'
const address_SOLANA_Token = '9RM3h2a1Azs4Cn84sMGtJbujBSp9igjuRpYH63BKMtju'
const address_Token = address_SOLANA_Token

const address_MUMBAI_ReadySwap = '0x6271Ca068f874c06A5bdB7889D02914a39e67842'
const address_Swap = '9RM3h2a1Azs4Cn84sMGtJbujBSp9igjuRpYH63BKMtju'

// const pKey = '0x3481E79956D4BD95F358AC96D151C976392FC4E3FC132F78A847906DE588C145'
const pKey = '0xb1ba1db577a36421924a87026cda27523851c6e88123d0a0a1def9a974376176'

// const provider = new JsonRpcProvider(ChainNamespace.eip155, 'https://matic-mumbai.chainstacklabs.com')
// const provider = new TronProvider('https://api.trongrid.io/jsonrpc', 'https://api.trongrid.io')
// const provider = new TronProvider('https://api.shasta.trongrid.io/jsonrpc', 'https://api.shasta.trongrid.io')
// const provider = new SolanaJsonRpcProvider('https://api.mainnet-beta.solana.com', { chainId: -1, name: 'solana' })
const provider = new SolanaJsonRpcProvider('http://api.testnet.solana.com', { chainId: -1, name: 'solana' })
// const provider = new SolanaJsonRpcProvider('http://api.devnet.solana.com', { chainId: -1, name: 'solana' })

const chainNamespace: ChainNamespace = provider.chainNamespace as any

const ABI_ERC20 =
  '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]'
// const ABI_TRC20 = '[{"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"Approval","type":"Event"},{"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"Transfer","type":"Event"},{"outputs":[{"type":"uint256"}],"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","stateMutability":"View","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","stateMutability":"Nonpayable","type":"Function"},{"outputs":[{"type":"uint256"}],"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","stateMutability":"View","type":"Function"},{"outputs":[{"type":"uint8"}],"constant":true,"name":"decimals","stateMutability":"View","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","stateMutability":"Nonpayable","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseAllowance","stateMutability":"Nonpayable","type":"Function"},{"outputs":[{"type":"string"}],"constant":true,"name":"name","stateMutability":"View","type":"Function"},{"outputs":[{"type":"string"}],"constant":true,"name":"symbol","stateMutability":"View","type":"Function"},{"outputs":[{"type":"uint256"}],"constant":true,"name":"totalSupply","stateMutability":"View","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","stateMutability":"Nonpayable","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"sender","type":"address"},{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","stateMutability":"Nonpayable","type":"Function"}]'
const ABI = ABI_ERC20

try {
  const network = await provider.getNetwork()
  console.log('<-- network: chainNamespace:', network.chainNamespace, '| chainId:', network.chainId, '| name:', network.name)
  console.log('<-- eth_chainId:', await provider.send('eth_chainId', []))
  console.log('<-- blockTag:', await provider._getBlockTag())
  console.log('<-- getBlock:', await provider.getBlock('finalized')) // latest
  console.log('<-- getLatestBlockhash:', await provider.getLatestBlockhash())
  console.log('<-- getAvatar:', await provider.getAvatar('eth'))
  console.log('<-- getBalance:', await provider.getBalance(address))
  if (chainNamespace === ChainNamespace.solana) {
    console.log(
      '<-- getTokenAccountsByOwner:',
      await provider.connection.getTokenAccountsByOwner(new PublicKey(address), {
        programId: SplToken.TOKEN_PROGRAM_ID
      })
    )
  }
  console.log('<-- getTransactionCount:', await provider.getTransactionCount(address))

  // console.log(`--  computeAddress:`, computeAddress(pKey, ChainNamespace.solana))

  const gasPrice = (await provider.getFeeData()).gasPrice ?? undefined
  console.log(`<-- gasPrice:`, gasPrice)

  // ----------------------------------------------------------------------------------

  {
    const transactionReceipt = await provider.getTransactionReceipt('3eguaBBfN1jAZgWZq9jWFBv61j88vuRSKyKDSr4KKXvGNMBDtUYoUUW2xYj1NnFALjBYBeNxzUc9j8aC4LxTJxLM')
    console.log('<-- transactionReceipt:', transactionReceipt)
  }

  {
    const transactionReceipt = await new TransactionResponse(
      { hash: '3eguaBBfN1jAZgWZq9jWFBv61j88vuRSKyKDSr4KKXvGNMBDtUYoUUW2xYj1NnFALjBYBeNxzUc9j8aC4LxTJxLM' } as any,
      provider
    ).wait()
    console.log('<-- transactionReceipt:', transactionReceipt)
  }

  // ----------------------------------------------------------------------------------

  let wallet = new Wallet(pKey)
  console.log('--  wallet:', wallet.address)
  wallet = wallet.connect(provider)
  console.log('--  wallet:', wallet.address)

  // ----------------------------------------------------------------------------------

  if (chainNamespace === ChainNamespace.eip155 || chainNamespace === ChainNamespace.tron) {
    console.log('<-- estimateGas (transfer NATIVE):', await wallet.estimateGas({ from: wallet.address, to: address, value: '0x01' }))

    console.log(
      '<-- estimateGas (SmartContract):',
      await wallet.estimateGas({
        from: wallet.address,
        to: address_Token,
        value: '0x0',
        // data: '0x70a08231000000000000000000000041f0cc5a2a84cd0f68ed1667070934542d673acbd8',
        data: new Interface(provider.chainNamespace, ABI).encodeFunctionData('transfer', [address, 0])
      })
    )
  }

  if (chainNamespace === ChainNamespace.solana) {
    console.log(
      '<-- estimateGas SOLANA - transferSOL:',
      await wallet.estimateGas({ solana: { transaction: await getSolanaTransaction(SolanaTransactionType.transferSOL, provider.connection, undefined, false, 1) } })
    )
    console.log(
      '<-- estimateGas SOLANA - transferToken:',
      await wallet.estimateGas({ solana: { transaction: await getSolanaTransaction(SolanaTransactionType.transferToken, provider.connection, undefined, false, 1) } })
    )
    console.log(
      '<-- estimateGas SOLANA - wrap:',
      await wallet.estimateGas({ solana: { transaction: await getSolanaTransaction(SolanaTransactionType.wrap, provider.connection, undefined, false, 1) } })
    )
    console.log(
      '<-- estimateGas SOLANA - unwrap:',
      await wallet.estimateGas({ solana: { transaction: await getSolanaTransaction(SolanaTransactionType.unwrap, provider.connection, undefined, false, 0) } })
    )
    console.log(
      '<-- estimateGas SOLANA - swap:',
      await wallet.estimateGas({ solana: { transaction: await getSolanaTransaction(SolanaTransactionType.swap, provider.connection, undefined, false, 1) } })
    )
  }

  // ----------------------------------------------------------------------------------

  {
    const transactionResponse = await wallet.sendTransaction({
      to: address,
      value: '0x01',
      tron: { transactionType: TronTransactionType.sendTrx },
      solana: { transaction: await getSolanaTransaction(SolanaTransactionType.transferSOL, provider.connection, wallet.wallet as SolanaWallet, true, 10000000) }
    })
    console.log('<-- sendTransaction (NATIVE):', transactionResponse)

    const transactionReceipt = await transactionResponse.wait()
    console.log('<-- transactionReceipt (Token):', transactionReceipt)
  }

  {
    const transactionResponse = await wallet.sendTransaction({
      to: address_Token,
      // value: "0x01",
      data: new Interface(wallet.provider.chainNamespace, ABI).encodeFunctionData('transfer', [address, 0]),
      customData: {
        function: 'transfer(address,uint256)',
        parameter: [
          { type: 'address', value: address },
          { type: 'uint256', value: 100 }
        ]
      },
      gasPrice,
      tron: { transactionType: TronTransactionType.triggerSmartContract },
      solana: { transaction: await getSolanaTransaction(SolanaTransactionType.transferToken, provider.connection, wallet.wallet as SolanaWallet, true, 10000000) }
    })
    console.log('<-- sendTransaction (Token):', transactionResponse)

    const transactionReceipt = await transactionResponse.wait()
    console.log('<-- transactionReceipt (Token):', transactionReceipt)
  }

  // ----------------------------------------------------------------------------------

  if (chainNamespace === ChainNamespace.eip155 || chainNamespace === ChainNamespace.tron) {
    const tokenContract = new Contract(provider.chainNamespace, address_Token, ABI, wallet)

    const estimatedGas = await tokenContract.approve.estimateGas(address, 1)
    console.log('<-- tokenContract.approve.estimateGas:', estimatedGas)

    console.log('<-- tokenContract.allowance:', await tokenContract.allowance(wallet.address, address_Swap))

    const pendingTxn = await tokenContract.approve(address, 1, {
      gasPrice,
      gasLimit: estimatedGas,
      nonce: await provider.getTransactionCount(wallet.address)
    })
    console.log('<-- Contract.approve:', pendingTxn)
    pendingTxn.wait().then((receipt) => {
      console.log('<-- onReceipt:', receipt)
    })
  }
} catch (e) {
  console.error('!-- ERROR:', e)
} finally {
  provider.destroy()
}

async function getSolanaTransaction(transactionType: SolanaTransactionType, connection: Connection, wallet: SolanaWallet | undefined, isBroadcast: boolean, amount: number) {
  const fromPubkey = new PublicKey(address)
  const toPubkey = new PublicKey('C1AhjxZydV1gibKfsDtyiSz4N776t5dMXrLd4jp8aAb8')

  let instructions: Transaction | TransactionInstructionCtorFields
  switch (transactionType) {
    case SolanaTransactionType.transferSOL: {
      instructions = SystemProgram.transfer({ fromPubkey, toPubkey, lamports: amount })
      break
    }
    case SolanaTransactionType.transferToken: {
      const fromAssociatedTokenAccount = SplToken.getAssociatedTokenAddressSync(SplToken.NATIVE_MINT, fromPubkey)
      const toAssociatedTokenAccount = isBroadcast
        ? (await SplToken.getOrCreateAssociatedTokenAccount(connection, wallet.signer, SplToken.NATIVE_MINT, toPubkey)).address
        : SplToken.getAssociatedTokenAddressSync(SplToken.NATIVE_MINT, toPubkey)
      instructions = SplToken.createTransferInstruction(fromAssociatedTokenAccount, toAssociatedTokenAccount, fromPubkey, amount)
      break
    }
    case SolanaTransactionType.wrap: {
      const associatedTokenAccount = await SplToken.getAssociatedTokenAddress(SplToken.NATIVE_MINT, fromPubkey)
      instructions =
        (SplToken.createAssociatedTokenAccountInstruction(fromPubkey, associatedTokenAccount, fromPubkey, SplToken.NATIVE_MINT),
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: associatedTokenAccount,
          lamports: amount
        }),
        SplToken.createSyncNativeInstruction(associatedTokenAccount))
      break
    }
    case SolanaTransactionType.unwrap: {
      const associatedTokenAccount = await SplToken.getAssociatedTokenAddress(SplToken.NATIVE_MINT, fromPubkey)
      const ataBalance = await connection.getBalance(associatedTokenAccount)
      console.log('--  WSOL associatedTokenAccount balance:', ataBalance)
      if (ataBalance == amount) instructions = SplToken.createCloseAccountInstruction(associatedTokenAccount, fromPubkey, fromPubkey)
      else {
        // TODO: unwrap only a certain amount of wrapped SOL:
        // - Create a temporary wSOL token account
        // - Transfer X amount from wSOL main token account to temporary wSOL
        // - Close temporary wSOL token account into recipient
        throw new Error('Unwapping a certain amount of wrapped SOL is not supported at the moment')
      }
      break
    }
    case SolanaTransactionType.swap: {
      const fromAssociatedTokenAccount = await SplToken.getAssociatedTokenAddress(SplToken.NATIVE_MINT, fromPubkey)
      const toAssociatedTokenAccount = await SplToken.getAssociatedTokenAddress(SplToken.NATIVE_MINT, toPubkey)

      instructions = swapInstruction(
        toPubkey, // tokenSwap
        fromPubkey, // authority
        fromPubkey, // userTransferAuthority
        fromAssociatedTokenAccount, // userSource
        new PublicKey('address'), // poolSource
        new PublicKey('address'), // poolDestination
        toAssociatedTokenAccount, // userDestination
        new PublicKey('address'), // poolMint
        fromPubkey, // feeAccount
        null, // hostFeeAccount
        new PublicKey('address'), // sourceMint
        new PublicKey('address'), // destinationMint
        new PublicKey('address'), // swapProgramId
        new PublicKey('address'), // sourceTokenProgramId
        new PublicKey('address'), // destinationTokenProgramId
        new PublicKey('address'), // poolTokenProgramId
        1, // amountIn
        1 // minimumAmountOut
      )
      break
    }
    default:
      throw new Error('Transaction type not implemented: ' + transactionType)
  }

  const transaction = new Transaction({ feePayer: fromPubkey })
  // const transaction = new VersionedTransaction(new MessageV0({}))

  return transaction.add(instructions)
}

// from @solana/spl-token-swap
function swapInstruction(
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  userSource: PublicKey,
  poolSource: PublicKey,
  poolDestination: PublicKey,
  userDestination: PublicKey,
  poolMint: PublicKey,
  feeAccount: PublicKey,
  hostFeeAccount: PublicKey | null,
  sourceMint: PublicKey,
  destinationMint: PublicKey,
  swapProgramId: PublicKey,
  sourceTokenProgramId: PublicKey,
  destinationTokenProgramId: PublicKey,
  poolTokenProgramId: PublicKey,
  amountIn: number,
  minimumAmountOut: number
): TransactionInstruction {
  const dataLayout = BufferLayout.struct<any>([BufferLayout.u8('instruction'), BufferLayout.blob(8, 'amountIn'), BufferLayout.blob(8, 'minimumAmountOut')])

  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: 1, // Swap instruction
      amountIn: toBuffer(amountIn),
      minimumAmountOut: toBuffer(minimumAmountOut)
    },
    data
  )

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: userSource, isSigner: false, isWritable: true },
    { pubkey: poolSource, isSigner: false, isWritable: true },
    { pubkey: poolDestination, isSigner: false, isWritable: true },
    { pubkey: userDestination, isSigner: false, isWritable: true },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: feeAccount, isSigner: false, isWritable: true },
    { pubkey: sourceMint, isSigner: false, isWritable: false },
    { pubkey: destinationMint, isSigner: false, isWritable: false },
    { pubkey: sourceTokenProgramId, isSigner: false, isWritable: false },
    { pubkey: destinationTokenProgramId, isSigner: false, isWritable: false },
    { pubkey: poolTokenProgramId, isSigner: false, isWritable: false }
  ]
  if (hostFeeAccount !== null) {
    keys.push({ pubkey: hostFeeAccount, isSigner: false, isWritable: true })
  }
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data
  })
}

function toBuffer(number: number): Buffer {
  const a = new BN(number).toArray().reverse()
  const b = Buffer.from(a)
  if (b.length === 8) {
    return b
  }
  assert(b.length < 8, 'Numberu64 too large')

  const zeroPad = Buffer.alloc(8)
  b.copy(zeroPad)
  return zeroPad
}
