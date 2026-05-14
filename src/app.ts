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

app.get('/', async (_req, reply) => {
  return reply.send({
    service: 'WalFeed API',
    docs: 'Use /api/health for readiness. API routes are under /api/*.',
  })
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
    if (
      error.code === 'P1001' ||
      error.code === 'P1017' ||
      error.code === 'P1011'
    ) {
      return reply.status(503).send({
        message:
          'The database refused the connection. Check DATABASE_URL, that Postgres is reachable, and (Neon) that the project is not paused.',
      })
    }
    if (error.code === 'P2002') {
      return reply.status(409).send({
        message: 'This email is already registered. Try signing in instead.',
      })
    }
    if (error.code === 'P2003') {
      return reply.status(400).send({
        message: 'Something in your request is no longer available. Refresh the page and try again.',
      })
    }
    if (error.code === 'P2025') {
      return reply.status(404).send({ message: 'We could not find that item.' })
    }
    if (error.code === 'P2022' || error.code === 'P2021') {
      return reply.status(503).send({
        message:
          'The database is missing recent tables or columns. From the backend project folder, run: npx prisma migrate deploy',
      })
    }
  }

  if (
    error instanceof Prisma.PrismaClientUnknownRequestError &&
    /column|does not exist|42703/i.test(error.message)
  ) {
    return reply.status(503).send({
      message:
        'The database is missing recent tables or columns. From the backend project folder, run: npx prisma migrate deploy',
    })
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return reply.status(503).send({
      message:
        'The API could not open a database connection. Verify DATABASE_URL in .env, run prisma migrate deploy, and restart the server.',
    })
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    request.log.error(error)
    return reply.status(503).send({
      message: 'A storage issue occurred. Please try again shortly.',
    })
  }

  const status =
    typeof (error as { statusCode?: number }).statusCode === 'number'
      ? (error as { statusCode: number }).statusCode
      : 500

  if (status >= 500) {
    request.log.error(error)
    return reply.status(status).send({
      message: 'Something went wrong. Please try again shortly.',
    })
  }

  return reply.status(status).send({
    message: 'We could not complete that action. Please try again.',
  })
})

export default app
