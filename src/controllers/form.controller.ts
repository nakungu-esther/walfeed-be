import type { FastifyReply, FastifyRequest } from 'fastify'

import { prisma } from '../config/prisma'

type CreateFormBody = {
  title?: string
  description?: string
  fields?: unknown
  userId?: string
}

export async function createForm(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as CreateFormBody

  if (!body?.title || !body?.userId || body.fields === undefined) {
    return reply
      .status(400)
      .send({ message: 'title, userId, and fields are required' })
  }

  const form = await prisma.form.create({
    data: {
      title: body.title,
      description: body.description,
      fields: body.fields as object,
      userId: body.userId,
    },
  })

  return reply.send(form)
}

export async function getForms(_req: FastifyRequest, _reply: FastifyReply) {
  return prisma.form.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { submissions: true } },
    },
  })
}
