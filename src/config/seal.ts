import type { WalrusNetwork } from './walrus'
import { getWalrusNetwork, parseWalrusNetwork } from './walrus'

/** Seal tracks Walrus by default so demos stay consistent. */
export function getSealNetwork(): WalrusNetwork {
  if (process.env.SEAL_NETWORK?.trim()) {
    return parseWalrusNetwork(process.env.SEAL_NETWORK)
  }
  return getWalrusNetwork()
}

/** Sui network used for Seal RPC (verified Walrus key servers are published on testnet). */
export type SealSuiNetwork = 'testnet' | 'mainnet'

export function parseSealSuiNetwork(value: string | undefined): SealSuiNetwork {
  const n = (value || 'testnet').toLowerCase()
  if (n === 'mainnet') return 'mainnet'
  return 'testnet'
}

export function getSealSuiNetwork(): SealSuiNetwork {
  return parseSealSuiNetwork(process.env.SEAL_SUI_NETWORK?.trim())
}

/**
 * Verified independent key servers (testnet), from
 * https://seal-docs.wal.app/UsingSeal#option-2-independent-only
 */
export const SEAL_TESTNET_VERIFIED_INDEPENDENT_SERVERS = [
  {
    objectId:
      '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    weight: 1,
  },
  {
    objectId:
      '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
    weight: 1,
  },
] as const

/**
 * Mysten allowlist example on testnet (same as @mysten/seal integration tests).
 * Encryption binds to this identity; decryption requires a wallet that passes `seal_approve`.
 */
export const SEAL_TESTNET_DEFAULT_POLICY_PACKAGE_ID =
  '0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82'
export const SEAL_TESTNET_DEFAULT_IDENTITY_ID =
  '0x5809c296d41e0d6177e8cf956010c1d2387299892bb9122ca4ba4ffd165e05cb'

export type SealServerConfigJson = {
  objectId: string
  weight: number
  aggregatorUrl?: string
  apiKeyName?: string
  apiKey?: string
}

export function getSealServerConfigs(): SealServerConfigJson[] {
  const raw = process.env.SEAL_SERVER_CONFIGS?.trim()
  if (raw) {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('SEAL_SERVER_CONFIGS must be a non-empty JSON array')
    }
    return parsed as SealServerConfigJson[]
  }
  return [...SEAL_TESTNET_VERIFIED_INDEPENDENT_SERVERS]
}

export function getSealPolicyPackageId(): string {
  return (
    process.env.SEAL_POLICY_PACKAGE_ID?.trim() ||
    SEAL_TESTNET_DEFAULT_POLICY_PACKAGE_ID
  )
}

export function getSealIdentityId(): string {
  return (
    process.env.SEAL_IDENTITY_ID?.trim() || SEAL_TESTNET_DEFAULT_IDENTITY_ID
  )
}

export function getSealThreshold(): number {
  const t = Number(process.env.SEAL_THRESHOLD)
  if (Number.isFinite(t) && t >= 1) return Math.floor(t)
  const configs = getSealServerConfigs()
  return configs.reduce((s, c) => s + c.weight, 0)
}

export function getSealVerifyKeyServers(): boolean {
  return process.env.SEAL_VERIFY_KEY_SERVERS === '1'
}

/** When true, keep the JSON placeholder envelope (no RPC, no Seal). */
export function useSealPlaceholderOnly(): boolean {
  if (process.env.SEAL_PLACEHOLDER_ONLY === '1') return true
  if (process.env.SEAL_REAL_ENCRYPT === '1') return false
  if (process.env.SEAL_PLACEHOLDER_ONLY === '0') return false
  return true
}

/** HTTP timeout (ms) for Seal key-server / chain calls inside `SealClient`. */
export function getSealClientTimeoutMs(): number {
  const n = Number(process.env.SEAL_CLIENT_TIMEOUT_MS)
  if (Number.isFinite(n) && n >= 3000 && n <= 120_000) return Math.floor(n)
  return 8000
}
