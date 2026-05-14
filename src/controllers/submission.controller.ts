import type { FastifyReply, FastifyRequest } from 'fastify'

import { prisma } from '../config/prisma'
import { encryptData } from '../services/seal.service'
import { uploadToWalrus } from '../services/walrus.service'
import { resolveListScope } from '../utils/listScope'
import { jwtUser } from '../utils/requireAuth'

type CreateSubmissionBody = {
  formId?: string
  data?: unknown
}

export async function createSubmission(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = req.body as CreateSubmissionBody

  if (!body?.formId || body.data === undefined) {
    return reply
      .status(400)
      .send({
        message: 'This submission is incomplete. Please refresh the page and try again.',
      })
  }

  const form = await prisma.form.findUnique({
    where: { id: body.formId },
    select: { id: true },
  })
  if (!form) {
    return reply.status(404).send({ message: 'This form could not be found.' })
  }

  const encrypted = await encryptData(body.data)

  const walrusUpload = await uploadToWalrus(encrypted)

  const submission = await prisma.submission.create({
    data: {
      formId: body.formId,
      data: encrypted as object,
      walrusHash: walrusUpload.hash,
    },
  })

  return reply.send(submission)
}

export async function getSubmissions(req: FastifyRequest, reply: FastifyReply) {
  const scope = await resolveListScope(req)
  if (scope.kind === 'unauthorized') {
    return reply.status(401).send({
      message: 'Your session has expired. Please sign in again.',
    })
  }
  const where =
    scope.kind === 'owner' ? { form: { userId: scope.userId } } : {}

  const rows = await prisma.submission.findMany({
    where,
    include: { form: true },
    orderBy: { createdAt: 'desc' },
  })
  return reply.send(rows)
}

type PatchSubmissionBody = {
  adminNote?: string | null
  priority?: string | null
}

export async function patchSubmission(req: FastifyRequest, reply: FastifyReply) {
  const user = jwtUser(req)
  const id = (req.params as { id: string }).id
  const body = req.body as PatchSubmissionBody

  const hasAdmin =
    Object.prototype.hasOwnProperty.call(body, 'adminNote') ||
    Object.prototype.hasOwnProperty.call(body, 'priority')
  if (!hasAdmin) {
    return reply
      .status(400)
      .send({
        message: 'Please enter a note or choose a priority before saving.',
      })
  }

  const sub = await prisma.submission.findUnique({
    where: { id },
    include: { form: true },
  })
  if (!sub) {
    return reply.status(404).send({ message: 'This submission could not be found.' })
  }
  if (sub.form.userId !== user.id) {
    return reply
      .status(403)
      .send({
        message: 'Only the owner of this form can add notes or change priority.',
      })
  }

  const data: { adminNote?: string | null; priority?: string | null } = {}
  if (Object.prototype.hasOwnProperty.call(body, 'adminNote')) {
    data.adminNote =
      body.adminNote === undefined || body.adminNote === null
        ? null
        : String(body.adminNote)
  }
  if (Object.prototype.hasOwnProperty.call(body, 'priority')) {
    data.priority =
      body.priority === undefined || body.priority === null
        ? null
        : String(body.priority)
  }

  const updated = await prisma.submission.update({
    where: { id },
    data,
    include: { form: true },
  })
  return reply.send(updated)
}
