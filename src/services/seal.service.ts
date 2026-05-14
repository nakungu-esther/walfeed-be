import { getSealNetwork } from '../config/seal'

export async function encryptData(data: unknown) {
  const sealNetwork = getSealNetwork()
  console.log(`[Seal] network=${sealNetwork}`)

  return {
    encrypted: JSON.stringify(data),
  }
}
