import { getWalrusEndpoint, getWalrusNetwork } from '../config/walrus'

type WalrusStoreJson = {
  newlyCreated?: { blobObject?: { blobId?: string } }
  alreadyCertified?: { blobId?: string }
}

function walrusStubHash(bodyText: string, network: string) {
  const stub = Buffer.from(bodyText, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    .slice(0, 48)
  return `stub_${network}_${stub}`
}

function publisherTimeoutMs(): number {
  const n = Number(process.env.WALRUS_PUBLISHER_TIMEOUT_MS)
  if (Number.isFinite(n) && n >= 2000 && n <= 120_000) return Math.floor(n)
  return 8000
}

/**
 * Upload encrypted payload to Walrus via HTTP publisher when
 * `WALRUS_PUBLISHER_URL` is set (see Walrus docs: PUT /v1/blobs?epochs=N).
 * Otherwise returns a deterministic dev stub so the app runs without a publisher.
 */
export async function uploadToWalrus(data: unknown) {
  const network = getWalrusNetwork()
  const aggregator = getWalrusEndpoint()
  const publisherUrl = process.env.WALRUS_PUBLISHER_URL?.trim()
  const epochs = process.env.WALRUS_EPOCHS?.trim() || '1'

  const bodyText =
    typeof data === 'string' ? data : JSON.stringify(data ?? null)
  const body = Buffer.from(bodyText, 'utf8')

  if (publisherUrl?.startsWith('http')) {
    const base = publisherUrl.replace(/\/$/, '')
    const url = `${base}/v1/blobs?epochs=${encodeURIComponent(epochs)}`
    const ms = publisherTimeoutMs()
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), ms)
    try {
      const res = await fetch(url, {
        method: 'PUT',
        body,
        headers: { 'Content-Type': 'application/octet-stream' },
        signal: controller.signal,
      })
      const text = await res.text()
      if (!res.ok) {
        throw new Error(
          `Walrus publisher ${res.status}: ${text.slice(0, 240)}`,
        )
      }
      let json: WalrusStoreJson
      try {
        json = JSON.parse(text) as WalrusStoreJson
      } catch {
        throw new Error('Walrus publisher returned non-JSON body')
      }
      const blobId =
        json.newlyCreated?.blobObject?.blobId ??
        json.alreadyCertified?.blobId
      if (!blobId) {
        throw new Error('Walrus response missing blobId')
      }
      return { hash: blobId, network, aggregator }
    } catch (err) {
      console.warn(
        '[walfeed/walrus] Publisher upload failed or timed out; using stub hash.',
        err,
      )
      return {
        hash: walrusStubHash(bodyText, network),
        network,
        aggregator,
      }
    } finally {
      clearTimeout(t)
    }
  }

  return {
    hash: walrusStubHash(bodyText, network),
    network,
    aggregator,
  }
}
