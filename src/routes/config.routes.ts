import type { FastifyInstance } from 'fastify'

import { getSealNetwork, useSealPlaceholderOnly } from '../config/seal'
import { getWalrusEndpoint, getWalrusNetwork } from '../config/walrus'

function walrusUploadMode(): 'publisher' | 'stub' {
  const u = process.env.WALRUS_PUBLISHER_URL?.trim()
  return u?.startsWith('http') ? 'publisher' : 'stub'
}

export default async function configRoutes(app: FastifyInstance) {
  app.get('/deployment', async () => ({
    walrusNetwork: getWalrusNetwork(),
    walrusEndpoint: getWalrusEndpoint(),
    sealNetwork: getSealNetwork(),
    walrusUploadMode: walrusUploadMode(),
    sealMode: useSealPlaceholderOnly() ? 'placeholder' : 'real',
  }))
}
