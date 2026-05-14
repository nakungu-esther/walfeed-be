import { getWalrusEndpoint, getWalrusNetwork } from '../config/walrus'

export async function uploadToWalrus(data: unknown) {
  const network = getWalrusNetwork()
  const endpoint = getWalrusEndpoint()
  console.log(`[Walrus] network=${network} endpoint=${endpoint}`, data)

  return {
    hash: `walrus_${network}_stub_hash`,
  }
}
