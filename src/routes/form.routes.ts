import type { FastifyInstance } from 'fastify'

import { createForm, getForms } from '../controllers/form.controller'

export default async function formRoutes(app: FastifyInstance) {
  app.post('/', createForm)
  app.get('/', getForms)
}
