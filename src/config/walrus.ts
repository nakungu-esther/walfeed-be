export type WalrusNetwork = 'devnet' | 'testnet' | 'mainnet'

const DEFAULT_ENDPOINTS: Record<WalrusNetwork, string> = {
  devnet: 'https://devnet.walrus.xyz',
  testnet: 'https://testnet.walrus.xyz',
  mainnet: 'https://mainnet.walrus.xyz',
}

export function parseWalrusNetwork(value: string | undefined): WalrusNetwork {
  const n = (value || 'devnet').toLowerCase()
  if (n === 'mainnet' || n === 'testnet' || n === 'devnet') return n
  return 'devnet'
}

export function getWalrusNetwork(): WalrusNetwork {
  return parseWalrusNetwork(process.env.WALRUS_NETWORK)
}

/** Explicit URL wins; otherwise derive from `WALRUS_NETWORK`. */
export function getWalrusEndpoint(): string {
  const explicit = process.env.WALRUS_ENDPOINT?.trim()
  if (explicit?.startsWith('http')) return explicit
  return DEFAULT_ENDPOINTS[getWalrusNetwork()]
}
