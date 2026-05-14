import type { FastifyInstance } from 'fastify'

import {
  createSubmission,
  getSubmissions,
  patchSubmission,
} from '../controllers/submission.controller'
import { requireJwtUser } from '../utils/requireAuth'

export default async function submissionRoutes(app: FastifyInstance) {
  app.get('/', getSubmissions)
  app.post('/', createSubmission)
  app.patch('/:id', { preHandler: requireJwtUser }, patchSubmission)
}
