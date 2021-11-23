import {
  Networks,
  Server,
  BASE_FEE,
  Keypair,
  Asset,
  Operation,
  Memo,
  Claimant,
  TransactionBuilder
} from 'stellar-sdk'


import { prompt } from './lib/prompt.js'
import {
  ASSET_CODE,
  ISSUER,
  DISTRIBUTOR,
  RECIPIENTS,
  XLM_AMOUNT,
  DORK_AMOUNT,
  MEMO_TEXT
} from './initial-drop-config.js'


const testnet = process.env.NODE_ENV === 'development'
const NETWORK = testnet ? 'TESTNET' : 'PUBLIC'
const networkPassphrase = Networks[NETWORK]
const HORIZON_URL = `https://horizon${testnet ? '-testnet' : ''}.stellar.org`
const TX_URL = `https://stellar.expert/explorer/${testnet ? 'testnet' : 'public'}/tx`
const server = new Server(HORIZON_URL)
const fee = (await server.fetchBaseFee()) || BASE_FEE
const txnOpts = {
  fee,
  networkPassphrase,
  timebounds: await server.fetchTimebounds(100)
}

const XLM = Asset.native()
const DORK = new Asset(ASSET_CODE, ISSUER)
const memo = Memo.text(MEMO_TEXT)

const operations = RECIPIENTS.map(destination => {
  const payment = Operation.payment({
    asset: XLM,
    amount: XLM_AMOUNT.toString(),
    destination
  })
  const claimableBalance = Operation.createClaimableBalance({
    asset: DORK,
    amount: DORK_AMOUNT.toString(),
    claimants: [
      new Claimant(destination),
      new Claimant(DISTRIBUTOR)
    ]
  })
  return { payment, claimableBalance }
})

const sourceAccount = await server.loadAccount(DISTRIBUTOR)
let txn = new TransactionBuilder(sourceAccount, txnOpts)
operations.forEach(ops => {
  txn.addOperation(ops.payment)
  txn.addOperation(ops.claimableBalance)
})
txn = txn
  .addMemo(memo)
  .build()

const secret = await prompt('Enter distributor secret key:')
const signer = Keypair.fromSecret(secret)
txn.sign(signer)

console.log()

try {
  const response = await server.submitTransaction(txn)
  console.log(`XLM & ${ASSET_CODE} claimable balance(s) sent`)
  console.log(`${TX_URL}/${response.hash}`)
} catch (e) {
  console.error(e?.response?.data)
}

prompt.close()
