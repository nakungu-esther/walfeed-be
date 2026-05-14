import type { FastifyInstance } from 'fastify'

import { getSealNetwork } from '../config/seal'
import { getWalrusEndpoint, getWalrusNetwork } from '../config/walrus'

export default async function configRoutes(app: FastifyInstance) {
  app.get('/deployment', async () => ({
    walrusNetwork: getWalrusNetwork(),
    walrusEndpoint: getWalrusEndpoint(),
    sealNetwork: getSealNetwork(),
  }))
}
