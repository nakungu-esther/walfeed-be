import type { FastifyInstance } from 'fastify'

import {
  createSubmission,
  getSubmissions,
} from '../controllers/submission.controller'

export default async function submissionRoutes(app: FastifyInstance) {
  app.post('/', createSubmission)
  app.get('/', getSubmissions)
}
