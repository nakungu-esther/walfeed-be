import type { WalrusNetwork } from './walrus'
import { getWalrusNetwork, parseWalrusNetwork } from './walrus'

/** Seal tracks Walrus by default so demos stay consistent. */
export function getSealNetwork(): WalrusNetwork {
  if (process.env.SEAL_NETWORK?.trim()) {
    return parseWalrusNetwork(process.env.SEAL_NETWORK)
  }
  return getWalrusNetwork()
}
