import {ethers} from 'ethers';
import Web3 from 'web3';
import HDWalletProvider from '@truffle/hdwallet-provider';
import { routerAbi, tokenAbi } from './default-abi.js';
import { any } from 'async';

/***************************************/
/*          wallet functions           */
/***************************************/
export async function dsWalletConnectInjected(chainId) {
  if (!window.ethereum)
      return null;
  try {
    const strChainId = '0x' + chainId.toString(16);
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: strChainId }],
    });
    const[account] = await window.ethereum.request({method: 'eth_requestAccounts'});
    return account;
  } catch (err) {
      console.log(err.message);
  }
  return null;
}

export function dsWalletGetTrimedAccountName(account) {
  return account.substr(2,4) + '...' + account.substr(-4, 4);
}

/***************************************/
/*          ethers.js functions        */
/***************************************/
// check if wallet address valid
export function dsWeb3IsAddrValid(address) {
  return Web3.utils.isAddress(address);
}

// get web3 provider
export function dsEthersGetWeb3Provider() {
  if (!window.ethereum)
  {
      alert("Metamask is not installed.")
      return null;
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return provider;
}

// get contract object 
export function dsEthersGetContract(addr, abi, isTrReq) {
  if (!window.ethereum)
  {
      alert("Metamask is not installed.")
      return;
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  let contract;
  if (isTrReq === true)
  {
      const signer = provider.getSigner();
      contract = new ethers.Contract(addr, abi, signer);
  } else {
      contract = new ethers.Contract(addr, abi, provider);
  }
  return contract;
}

/***************************************/
/*          web3.js  functions         */
/***************************************/
export function dsWeb3GetSignedContract(chainId, privateKey, contractAbi, contractAddr) {
  const provider = new HDWalletProvider(privateKey, chainId);
  const web3 = new Web3(provider);
  const contract = new web3.eth.Contract(contractAbi, contractAddr);
  return contract;
}

/**
 * Get web3 from provider
 * @param rpc provider
 * @returns web3
 */
export function dsWeb3Get(provider) {
  let web3;
  if (typeof provider === 'undefined')
    web3 = new Web3(window.web3.currentProvider);
  else
    web3 = new Web3(provider);
  return web3;
}

// get web3 contract
export function dsWeb3GetContract(provider, address, abi) {
  const web3 = dsWeb3Get(provider)
  const contract = new web3.eth.Contract(abi, address);
  return contract;
}

// get current account
export async function dsWeb3GetCurrentAccount() {
  const web3 = new Web3(window.web3.currentProvider);
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
}

// get account address from private key
export function dsWeb3GetAddressFromPrivKey(provider, privKey) {
  const web3 = dsWeb3Get(provider)
  const address = web3.eth.accounts.privateKeyToAccount(privKey).address
  return address
}

// get estimate gas
export async function dsWeb3EstimateGas(provider, privKey, transaction, eth) {
  const web3 = dsWeb3Get(provider)
  const gasPrice = await web3.eth.getGasPrice()
  const account = privKey === null 
    ? provider.selectedAddress
    : web3.eth.accounts.privateKeyToAccount(privKey).address
  const gas = await transaction.estimateGas({from:account, value:eth})
  return gas
}

// send transaction
export async function dsWeb3SendTransaction(provider, privateKey, transaction, eth) {
  const web3 = dsWeb3Get(provider)
  const gasPrice = await web3.eth.getGasPrice()
  const account = privateKey === null 
    ? provider.selectedAddress
    : web3.eth.accounts.privateKeyToAccount(privateKey).address
  const gas = await transaction.estimateGas({from:account, value:eth})
  if (privateKey === null) {
    const trPending = transaction.send({
      from  : account,
      value : eth,
      gas   : gas
    })
    return trPending
  } else {
    const options = {
      to: transaction._parent._address,
      data: transaction.encodeABI(),
      gas: gas,
      gasPrice: gasPrice,
      value: eth
    }
    const signed = await web3.eth.accounts.signTransaction(options, privateKey)
    const trResult = await web3.eth.sendSignedTransaction(signed.rawTransaction)
    const spentGas = trResult.gasUsed * gasPrice
    // console.log(`[DSWEB3] dsWeb3SendTransaction :: transaction result = `, spentGas)
    return spentGas
  }
}

// get eth balance 
export async function dsWeb3GetBalance(provider, address) {
  const web3 = dsWeb3Get(provider)
  return await web3.eth.getBalance(address)
}

// get token balance
export async function dsWeb3GetTokenBalance(token, account, provider) {
  let contract
  if (typeof token === 'string') {
    contract = dsWeb3GetContract(provider, token, tokenAbi)
  } else {
    contract = token
  }
  const request = contract.methods.balanceOf(account).call()
  let balance = 0
  await request.then(function(recipent) {
    balance = recipent
  }).catch(function(error) {
    const msg = dsErrMsgGet(error.message)
    console.log(msg)
  })
  return balance
}

// send coin
export async function dsWeb3SendCoin(provider, pKey, to, amount) {
  const web3 = dsWeb3Get(provider)
  const options = {
    to: to,
    gas: 30000,
    value: amount
  }
  const signed = await web3.eth.accounts.signTransaction(options, pKey)
  await web3.eth.sendSignedTransaction(signed.rawTransaction)
}

// get token price
export async function dsWeb3GetTokenPrice(provider, token, stableCoin) {
  let contract = dsWeb3GetContract(provider, token, tokenAbi)
  let router
  // get router address
  await contract.methods.router().call()
    .then(function(recipent) {
      router = recipent
    })
    .catch( function(error) {
      const msg = dsErrMsgGet(error.message)
      console.log(msg)
    })
    
  if (router === undefined)
    return undefined
    
  // get price
  let price
  contract = dsWeb3GetContract(provider, router, routerAbi)
  await contract.methods
    .getAmountsOut(dsBnEthToWei(1), [token, stableCoin]).call()
    .then(function(recipent) {      
      price = dsBnWeiToEth(recipent[1])
    })
    .catch(function(error) {
      const msg = dsErrMsgGet(error.message)
      console.log(msg)
    })
  
  return price
}

// get token price
export async function dsWeb3GetTokenPriceByRouter(provider, router, token, stableCoin) {
  let priceInWeth
  let price
  const contract = dsWeb3GetContract(provider, router, routerAbi)
  const weth = await contract.methods.WETH().call()
  await contract.methods
    .getAmountsOut(dsBnEthToWei("1"), [token, weth]).call()
      .then(function(recipent) {      
        priceInWeth = recipent[1]
      })
    .catch(function(error) {
      const msg = dsErrMsgGet(error.message)
    })
  
  await contract.methods
    .getAmountsOut(priceInWeth, [weth, stableCoin]).call()
    .then(function(recipent) {      
      price = recipent[1]
    })
    .catch(function(error) {
      const msg = dsErrMsgGet(error.message)
    })
  
  return price
}
/***************************************/
/*       bignumber  functions          */
/***************************************/
export const DECIMAL_DEFAULT = 18;
function getEthUnit(accuracy)
{
  let mapping = Web3.utils.unitMap;
  let valuePrecision = "";
  for (var i = 0; i < accuracy; i++) {
    valuePrecision = valuePrecision + "0";
  }
  let unitMapValue = 1 + valuePrecision;

  for (const key in mapping) {
    if (mapping[key] === unitMapValue) {
      return key;
    }
  }
  return null;
}

export function dsBnWeiToEth(wei, decimals, precision) {
  let ethVal;
  if (typeof decimals === 'undefined')
    ethVal = Web3.utils.fromWei(wei, 'ether');
  else if (typeof decimals === 'string') {
    ethVal = Web3.utils.fromWei(wei, decimals);
  }
  else
  {
    const unitEth = getEthUnit(decimals);
    ethVal = Web3.utils.fromWei(wei, unitEth);
  }

  const v = parseFloat(ethVal);
  if (typeof precision == 'undefined') {
    if (v < 1)
      precision = 8;
    else
      precision = 4;
  }

  ethVal = v.toFixed(precision).replace(/\.?0*$/,'');
  return parseFloat(ethVal);
}

export function dsBnEthToWei(eth, decimals) {
  let weiVal;

  if (typeof eth === 'undefined')
    return 0;

  if (typeof decimals === 'undefined') {
    weiVal = Web3.utils.toWei(eth, 'ether');
  }
  else
  {
    const unitEth = getEthUnit(decimals);
    weiVal = Web3.utils.toWei(parseFloat(eth).toFixed(decimals), unitEth);
  }

  return weiVal;
}

/***************************************/
/*       Error message functions       */
/***************************************/
export function dsErrMsgGet(message)
{ 
  const prefix = 'Internal JSON-RPC error.'
  let msg = message
  if(msg.startsWith(prefix)) {
    const str = msg.replace(prefix, '').trim()
    msg = JSON.parse(str).message
  }
  return msg
}