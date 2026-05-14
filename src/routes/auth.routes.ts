import type { FastifyInstance } from 'fastify'

import { login, register } from '../controllers/auth.controller'

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', register)
  app.post('/login', login)
}
