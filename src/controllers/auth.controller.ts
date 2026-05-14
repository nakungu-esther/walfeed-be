import type { FastifyReply, FastifyRequest } from 'fastify'

import { prisma } from '../config/prisma'
import { comparePassword, hashPassword } from '../utils/hash'

type AuthBody = {
  email?: string
  password?: string
}

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as AuthBody

  if (!body?.email || !body?.password) {
    return reply.status(400).send({ message: 'email and password are required' })
  }

  const hashedPassword = await hashPassword(body.password)

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
    },
    select: { id: true, email: true, createdAt: true },
  })

  return reply.send(user)
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as AuthBody

  if (!body?.email || !body?.password) {
    return reply.status(400).send({ message: 'email and password are required' })
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  })

  if (!user) {
    return reply.status(404).send({ message: 'User not found' })
  }

  const validPassword = await comparePassword(body.password, user.password)

  if (!validPassword) {
    return reply.status(401).send({ message: 'Invalid credentials' })
  }

  const token = await reply.jwtSign({
    id: user.id,
    email: user.email,
  })

  return reply.send({ token })
}
