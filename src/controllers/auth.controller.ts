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
    return reply
      .status(400)
      .send({ message: 'Please enter your email and password.' })
  }

  const email = String(body.email).trim().toLowerCase()
  const password = String(body.password)

  if (!email || !password) {
    return reply
      .status(400)
      .send({ message: 'Please enter your email and password.' })
  }

  if (password.length < 8) {
    return reply.status(400).send({
      message: 'Please use a password of at least 8 characters.',
    })
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
    select: { id: true, email: true, createdAt: true },
  })

  const token = await reply.jwtSign({
    id: user.id,
    email: user.email,
  })

  return reply.send({
    token,
    user: { id: user.id, email: user.email },
    createdAt: user.createdAt,
  })
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as AuthBody

  if (!body?.email || !body?.password) {
    return reply
      .status(400)
      .send({ message: 'Please enter your email and password.' })
  }

  const email = String(body.email).trim().toLowerCase()
  const password = String(body.password)

  if (!email || !password) {
    return reply
      .status(400)
      .send({ message: 'Please enter your email and password.' })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return reply.status(404).send({ message: 'No account was found for this email.' })
  }

  const validPassword = await comparePassword(password, user.password)

  if (!validPassword) {
    return reply.status(401).send({ message: 'That email or password is incorrect.' })
  }

  const token = await reply.jwtSign({
    id: user.id,
    email: user.email,
  })

  return reply.send({
    token,
    user: { id: user.id, email: user.email },
  })
}
