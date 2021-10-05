import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { ChainId } from '@swapr/sdk'
import { OutgoingMessageState } from 'arb-ts'
export type BridgeTxnStatus = 'pending' | 'confirmed' | 'failure' | 'dispute_period'

export type BridgeTxnType =
  | 'deposit'
  | 'deposit-l1'
  | 'deposit-l2'
  | 'withdraw'
  | 'outbox'
  | 'approve'
  | 'connext-deposit'
  | 'connext-withdraw'
  | 'deposit-l2-auto-redeem'

export enum BridgeAssetType {
  ETH = 'ETH',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721'
}

export type BridgeTxnsState = {
  [chainId: number]: {
    [txHash: string]: BridgeTxn
  }
}

export type BridgeTxn = {
  type: BridgeTxnType
  chainId: ChainId
  sender: string
  assetName: string
  assetType: BridgeAssetType
  value: string
  txHash: string
  blockNumber?: number
  timestampResolved?: number
  timestampCreated: number
  receipt?: TransactionReceipt
  seqNum?: number
  partnerTxHash?: string
  batchIndex?: string
  batchNumber?: string
  outgoingMessageState?: OutgoingMessageState
}