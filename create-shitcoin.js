import {
  Networks,
  Server,
  BASE_FEE,
  Keypair,
  Asset,
  Operation,
  TransactionBuilder
} from 'stellar-sdk'

import { prompt } from './lib/prompt.js'


prompt.open()
prompt.char('🔑')
const SOURCE = await prompt('Source account secret key:')
const ISSUER = await prompt('Asset issuer account secret key:')
const DISTRIBUTOR = await prompt('Asset distributor account secret key:')
prompt.char('🪙')
const ASSET_CODE = await prompt('Asset code:')
const HOME_DOMAIN = await prompt('Home domain:')
const SUPPLY = await prompt('Asset max/initial supply:')
const ISSUER_BAL = await prompt('Issuer account starting balance:')
const DISTRIBUTOR_BAL = await prompt('Distributor account starting balance:')
prompt.close()
console.log()

const source = Keypair.fromSecret(SOURCE)
const issuer = Keypair.fromSecret(ISSUER)
const distributor = Keypair.fromSecret(DISTRIBUTOR)
const asset = new Asset(ASSET_CODE, issuer.publicKey())

const testnet = process.env.NODE_ENV === 'development'
const NETWORK = testnet ? 'TESTNET' : 'PUBLIC'
const networkPassphrase = Networks[NETWORK]
const HORIZON_URL = `https://horizon${testnet ? '-testnet' : ''}.stellar.org`
const server = new Server(HORIZON_URL)
const fee = (await server.fetchBaseFee()) || BASE_FEE
const txnOpts = {
  fee,
  networkPassphrase,
  timebounds: await server.fetchTimebounds(100)
}

const createIssuer = Operation.createAccount({
  destination: issuer.publicKey(),
  startingBalance: ISSUER_BAL.toString()
})

const createDistributor = Operation.createAccount({
  destination: distributor.publicKey(),
  startingBalance: DISTRIBUTOR_BAL.toString()
})

const openTrustline = Operation.changeTrust({
  asset,
  source: distributor.publicKey()
})

const sendAsset = Operation.payment({
  destination: distributor.publicKey(),
  asset,
  amount: SUPPLY.toString(),
  source: issuer.publicKey()
})

const setHomeDomain = Operation.setOptions({
  homeDomain: HOME_DOMAIN,
  source: issuer.publicKey()
})

const sourceAccount = await server.loadAccount(source.publicKey())

const txn = new TransactionBuilder(sourceAccount, txnOpts)
      .addOperation(createIssuer)
      .addOperation(createDistributor)
      .addOperation(openTrustline)
      .addOperation(sendAsset)
      .addOperation(setHomeDomain)
      .build()
txn.sign(source, issuer, distributor)

try {
  await server.submitTransaction(txn)
  console.log(`Your shitcoin ${ASSET_CODE} is ready`)
} catch (e) {
  console.error(e?.response?.data)
}
