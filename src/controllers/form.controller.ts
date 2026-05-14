import type { FastifyReply, FastifyRequest } from 'fastify'

import { prisma } from '../config/prisma'
import { jwtUser } from '../utils/requireAuth'
import { resolveListScope } from '../utils/listScope'

type CreateFormBody = {
  title?: string
  description?: string
  fields?: unknown
  userId?: string
}

export async function createForm(req: FastifyRequest, reply: FastifyReply) {
  const user = jwtUser(req)
  const body = req.body as CreateFormBody

  if (!body?.title || body.fields === undefined) {
    return reply.status(400).send({
      message:
        'Please give your form a title, add at least one field, then try saving again.',
    })
  }

  const form = await prisma.form.create({
    data: {
      title: body.title,
      description: body.description,
      fields: body.fields as object,
      userId: user.id,
    },
  })

  return reply.send(form)
}

export async function getForms(req: FastifyRequest, reply: FastifyReply) {
  const scope = await resolveListScope(req)
  if (scope.kind === 'unauthorized') {
    return reply.status(401).send({
      message: 'Your session has expired. Please sign in again.',
    })
  }
  const where = scope.kind === 'owner' ? { userId: scope.userId } : {}

  const forms = await prisma.form.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { submissions: true } },
    },
  })
  return reply.send(forms)
}

export async function getFormById(req: FastifyRequest, reply: FastifyReply) {
  const id = (req.params as { id: string }).id
  const form = await prisma.form.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      fields: true,
      createdAt: true,
    },
  })
  if (!form) {
    return reply.status(404).send({ message: 'This form could not be found.' })
  }
  return reply.send(form)
}
