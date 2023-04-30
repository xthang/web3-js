import { Contract, Interface, TronProvider, Wallet } from './src.ts'

// const address = '0xF555f9e608E4F5d43BD3B38836b5401717c80721'
// const address = '0xcC6c0FC4beaF823365eF9F445f668cdDE35b0F0c'
const address = 'TJEN1hXp61v5U4imTMjVGFwDifKWcZPMXy'
// const address = 'TVJiKYP9M1Tp5o6yYmkaLUtsKguJo99ooH'
const address_MUMBAI_USDT = '0x8ba7E58bb14e56F5A2A1947C090a9Fcab1f98228'
const address_MAIN_WrappedTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR'
const address_SHASTA_USDC = 'TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id'
const address_SHASTA_USDT = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs'
const address_SHASTA_USDT_2 = 'TXXLsmZo5yzbwGZLoh7znccamTQyJx6Z74'
const address_SHASTA_USDJ = 'TLBaRhANQoJFTqre9Nf1mjuwNWjCJeYqUL'
const address_SHASTA_LFC = 'TXEPrQSjNxZoM8LqKGGZL3yYiFmGodAHVw'
const address_Token = address_SHASTA_USDT
const address_MUMBAI_ReadySwap = '0x6271Ca068f874c06A5bdB7889D02914a39e67842'
const address_Swap = 'TCNYd8L5hBey9FwPpvgtvDaY2cHjMFVLZu'

// const pKey = '0x3481E79956D4BD95F358AC96D151C976392FC4E3FC132F78A847906DE588C145'
const pKey = '0xb1ba1db577a36421924a87026cda27523851c6e88123d0a0a1def9a974376176'

// const provider = new JsonRpcProvider(ChainNamespace.eip155, 'https://matic-mumbai.chainstacklabs.com')
// const provider = new TronProvider('https://api.trongrid.io/jsonrpc', 'https://api.trongrid.io')
const provider = new TronProvider('https://api.shasta.trongrid.io/jsonrpc', 'https://api.shasta.trongrid.io')

const ABI_ERC20 = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]'
// const ABI_TRC20 = '[{"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"Approval","type":"Event"},{"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"Transfer","type":"Event"},{"outputs":[{"type":"uint256"}],"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","stateMutability":"View","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","stateMutability":"Nonpayable","type":"Function"},{"outputs":[{"type":"uint256"}],"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","stateMutability":"View","type":"Function"},{"outputs":[{"type":"uint8"}],"constant":true,"name":"decimals","stateMutability":"View","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","stateMutability":"Nonpayable","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseAllowance","stateMutability":"Nonpayable","type":"Function"},{"outputs":[{"type":"string"}],"constant":true,"name":"name","stateMutability":"View","type":"Function"},{"outputs":[{"type":"string"}],"constant":true,"name":"symbol","stateMutability":"View","type":"Function"},{"outputs":[{"type":"uint256"}],"constant":true,"name":"totalSupply","stateMutability":"View","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","stateMutability":"Nonpayable","type":"Function"},{"outputs":[{"type":"bool"}],"inputs":[{"name":"sender","type":"address"},{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","stateMutability":"Nonpayable","type":"Function"}]'
const ABI = ABI_ERC20

try {
  const network = await provider.getNetwork()
  console.log('<-- network: chainNamespace:', network.chainNamespace, '| chainId:', network.chainId, '| name:', network.name)
  console.log('<-- eth_chainId:', await provider.send('eth_chainId', []))
  // console.log('<-- blockTag:', await provider._getBlockTag())
  // console.log('<-- getAvatar:', await provider.getAvatar('eth'))
  console.log('<-- getBalance:', await provider.getBalance(address))

  // console.log(`--  computeAddress:`, computeAddress(pKey, ChainNamespace.solana))

  const gasPrice = (await provider.getFeeData()).gasPrice ?? undefined
  console.log(`<-- gasPrice:`, gasPrice)

  // ----------------------------------------------------------------------------------

  const wallet_ = new Wallet(pKey)
  console.log('--  wallet:', wallet_.address)
  const wallet = wallet_.connect(provider)
  console.log('--  wallet:', wallet.address)

  // ----------------------------------------------------------------------------------

  console.log('<-- estimateGas (transfer TRX):', await wallet.estimateGas({ from: wallet.address, to: address, value: "0x01", }))

  console.log('<-- estimateGas (SmartContract):', await wallet.estimateGas({
    from: wallet.address,
    to: address_Token,
    value: "0x0",
    // data: '0x70a08231000000000000000000000041f0cc5a2a84cd0f68ed1667070934542d673acbd8',
    data: new Interface(provider.chainNamespace, ABI).encodeFunctionData('transfer', [address, 0]),
  }))

  // console.log('<-- sendTransaction (sendNATIVE):', await wallet.sendTransaction({
  //   tronTransactionType: TransactionType.sendTrx,
  //   to: address,
  //   value: "0x01",
  // }))

  // console.log('<-- sendTransaction (triggerSmartContract):', await wallet.sendTransaction({
  //   tronTransactionType: TransactionType.triggerSmartContract,
  //   to: address_Token,
  //   // value: "0x01",
  //   data: new Interface(wallet.provider!.chainNamespace, ABI).encodeFunctionData('transfer', [address, 0]),
  //   customData: {
  //     function: 'transfer(address,uint256)',
  //     parameter: [{ type: 'address', value: address }, { type: 'uint256', value: 100 }]
  //   },
  //   gasPrice
  // }))

  // ----------------------------------------------------------------------------------

  const tokenContract = new Contract(provider.chainNamespace, address_Token, ABI, wallet)

  const estimatedGas = await tokenContract.approve.estimateGas(address, 1)
  console.log('<-- tokenContract.approve.estimateGas:', estimatedGas)

  console.log('<-- tokenContract.allowance:', await tokenContract.allowance(wallet.address, address_Swap))

  // const pendingTxn = await tokenContract.approve(address, 1, {
  //   gasPrice,
  //   gasLimit: estimatedGas,
  //   nonce: await provider.getTransactionCount(wallet.address),
  // })
  // console.log('<-- Contract.approve:', pendingTxn)
  // pendingTxn.wait().then((receipt) => {
  //   console.log('<-- onReceipt:', receipt)
  // })
} catch (e) {
  console.error('!-- ERROR:', e)
} finally {
  provider.destroy()
}