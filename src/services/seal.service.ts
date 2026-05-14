import { toBase64 } from '@mysten/bcs'
import { SealClient } from '@mysten/seal'
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'

import {
  getSealNetwork,
  getSealIdentityId,
  getSealPolicyPackageId,
  getSealServerConfigs,
  getSealSuiNetwork,
  getSealThreshold,
  getSealVerifyKeyServers,
  getSealClientTimeoutMs,
  useSealPlaceholderOnly,
} from '../config/seal'

let sealClientPromise: Promise<SealClient> | null = null

function getSealClient(): Promise<SealClient> {
  if (!sealClientPromise) {
    sealClientPromise = Promise.resolve().then(() => {
      const suiNetwork = getSealSuiNetwork()
      const suiClient = new SuiJsonRpcClient({
        network: suiNetwork,
        url: getJsonRpcFullnodeUrl(suiNetwork),
      })
      const serverConfigs = getSealServerConfigs().map((c) => ({
        objectId: c.objectId,
        weight: c.weight,
        ...(c.aggregatorUrl ? { aggregatorUrl: c.aggregatorUrl } : {}),
        ...(c.apiKeyName && c.apiKey
          ? { apiKeyName: c.apiKeyName, apiKey: c.apiKey }
          : {}),
      }))
      return new SealClient({
        suiClient,
        serverConfigs,
        verifyKeyServers: getSealVerifyKeyServers(),
        timeout: getSealClientTimeoutMs(),
      })
    })
  }
  return sealClientPromise
}

function placeholderEnvelope(data: unknown) {
  const sealNetwork = getSealNetwork()
  const payload =
    typeof data === 'string' ? data : JSON.stringify(data ?? null)

  return {
    v: 1,
    sealNetwork,
    alg: 'json+utf8-seal-placeholder',
    encrypted: payload,
    sealedAt: new Date().toISOString(),
  }
}

/**
 * Encrypt submission payload. By default uses a fast local envelope (no Sui RPC).
 * Set `SEAL_REAL_ENCRYPT=1` (and network envs) for Mysten Seal on testnet/mainnet.
 */
export async function encryptData(data: unknown) {
  if (useSealPlaceholderOnly()) {
    return placeholderEnvelope(data)
  }

  const payload =
    typeof data === 'string' ? data : JSON.stringify(data ?? null)
  const plaintext = new TextEncoder().encode(payload)

  try {
    const client = await getSealClient()
    const packageId = getSealPolicyPackageId()
    const id = getSealIdentityId()
    const threshold = getSealThreshold()

    const { encryptedObject } = await client.encrypt({
      threshold,
      packageId,
      id,
      data: plaintext,
    })

    const suiNetwork = getSealSuiNetwork()

    return {
      v: 2,
      seal: true,
      sealSuiNetwork: suiNetwork,
      sealNetwork: getSealNetwork(),
      alg: 'mysten-seal-boneh-franklin-aes-gcm',
      encryptedObjectB64: toBase64(encryptedObject),
      sealedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.warn(
      '[walfeed/seal] Real Seal encrypt failed; storing placeholder envelope instead.',
      err,
    )
    return placeholderEnvelope(data)
  }
}
