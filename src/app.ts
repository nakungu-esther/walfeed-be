import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { Prisma } from '@prisma/client'
import Fastify from 'fastify'

import { prisma } from './config/prisma'
import authRoutes from './routes/auth.routes'
import configRoutes from './routes/config.routes'
import formRoutes from './routes/form.routes'
import submissionRoutes from './routes/submission.routes'

const app = Fastify({
  logger: true,
})

app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})
app.register(multipart)
app.register(jwt, {
  secret: process.env.JWT_SECRET || 'secret',
})

app.register(authRoutes, { prefix: '/api/auth' })
app.register(configRoutes, { prefix: '/api/config' })
app.register(formRoutes, { prefix: '/api/forms' })
app.register(submissionRoutes, { prefix: '/api/submissions' })

app.get('/api/health', async (_req, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return reply.send({ ok: true, database: 'up' })
  } catch {
    return reply.status(503).send({ ok: false, database: 'down' })
  }
})

app.setErrorHandler((error, request, reply) => {
  if (reply.sent) return

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return reply
        .status(409)
        .send({ message: 'A record with this value already exists.' })
    }
    if (error.code === 'P2003') {
      return reply.status(400).send({
        message: 'Invalid reference: related record does not exist.',
      })
    }
    if (error.code === 'P2025') {
      return reply.status(404).send({ message: 'Record not found.' })
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return reply
      .status(503)
      .send({ message: 'Database is unavailable. Check DATABASE_URL.' })
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    request.log.error(error)
    return reply.status(503).send({ message: 'Database driver error.' })
  }

  const status =
    typeof (error as { statusCode?: number }).statusCode === 'number'
      ? (error as { statusCode: number }).statusCode
      : 500

  if (status >= 500) {
    request.log.error(error)
  }

  return reply.status(status).send({
    message:
      error instanceof Error ? error.message : 'Request failed. Try again.',
  })
})

export default app
