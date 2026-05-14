import type { FastifyInstance } from 'fastify'

import { createForm, getFormById, getForms } from '../controllers/form.controller'
import { requireJwtUser } from '../utils/requireAuth'

export default async function formRoutes(app: FastifyInstance) {
  app.get('/', getForms)
  app.post('/', { preHandler: requireJwtUser }, createForm)
  app.get('/:id', getFormById)
}
