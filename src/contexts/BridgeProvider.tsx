import React, { useContext, useEffect, useState } from 'react'
import { Bridge } from 'arb-ts'
import { providers, Signer } from 'ethers'
import { useDispatch } from 'react-redux'

import { useActiveWeb3React } from '../hooks'
import { useChains } from '../hooks/useChains'
import { NETWORK_DETAIL } from '../constants'
import { ChainIdPair } from '../utils/arbitrum'
import { INFURA_PROJECT_ID } from '../connectors'
import { POOLING_INTERVAL } from '../utils/getLibrary'

type BridgeContextType = {
  bridge: Bridge | null
  chainIdPair: ChainIdPair
}

const defaultValue: BridgeContextType = {
  bridge: null,
  chainIdPair: {
    l1ChainId: undefined,
    l2ChainId: undefined,
    chainId: undefined,
    partnerChainId: undefined
  }
}

export const BridgeContext = React.createContext<BridgeContextType>(defaultValue)

const addInfuraKey = (rpcUrl: string) => {
  if (rpcUrl.includes('infura')) {
    let updatedUrl = rpcUrl

    if (!rpcUrl.endsWith('/')) {
      updatedUrl = rpcUrl + '/'
    }

    return updatedUrl + INFURA_PROJECT_ID
  }

  return rpcUrl
}

export const BridgeProvider = ({ children }: { children?: React.ReactNode }) => {
  const { library, chainId, account } = useActiveWeb3React()
  const [bridge, setBridge] = useState<Bridge | null>(null)
  const chains = useChains()
  const dispatch = useDispatch()

  useEffect(() => {
    const abortController = new AbortController()

    const initBridge = async (
      signal: AbortSignal,
      ethSigner: Signer,
      arbSigner: Signer,
      l1GatewayRouterAddress?: string | undefined,
      l2GatewayRouterAddress?: string | undefined
    ) => {
      if (!signal.aborted) {
        await new Promise<void>(async (resolve, reject) => {
          signal.addEventListener('abort', reject)

          try {
            const bridge = await Bridge.init(ethSigner, arbSigner, l1GatewayRouterAddress, l2GatewayRouterAddress)
            setBridge(bridge)
            resolve()
          } catch (err) {
            reject()
          } finally {
            signal.removeEventListener('abort', reject)
          }
        }).catch(() => console.error('BridgeProvider: Failed to set the bridge'))
      }
    }

    setBridge(null)

    if (library && account && chainId) {
      const { partnerChainId, isArbitrum } = NETWORK_DETAIL[chainId]
      let l1Signer: providers.JsonRpcSigner, l2Signer: providers.JsonRpcSigner

      if (partnerChainId) {
        if (isArbitrum) {
          const rpcUrl = NETWORK_DETAIL[partnerChainId].rpcUrls[0]
          const l1Provider = new providers.JsonRpcProvider(addInfuraKey(rpcUrl))
          l1Provider.pollingInterval = POOLING_INTERVAL
          l1Signer = l1Provider.getSigner(account)
          l2Signer = library.getSigner()
        } else {
          const l2Provider = new providers.JsonRpcProvider(NETWORK_DETAIL[partnerChainId].rpcUrls[0])
          l2Provider.pollingInterval = POOLING_INTERVAL
          l1Signer = library.getSigner()
          l2Signer = l2Provider.getSigner(account)
        }

        if (l1Signer && l2Signer) {
          initBridge(abortController.signal, l1Signer, l2Signer)
        }
      }
    }

    return () => {
      abortController.abort()
    }
  }, [chainId, library, account, dispatch])

  return <BridgeContext.Provider value={{ bridge: bridge, chainIdPair: chains }}>{children}</BridgeContext.Provider>
}

export const useBridge = () => {
  return useContext(BridgeContext)
}
