import type { FastifyReply, FastifyRequest } from 'fastify'

import { prisma } from '../config/prisma'
import { encryptData } from '../services/seal.service'
import { uploadToWalrus } from '../services/walrus.service'

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
    return reply.status(400).send({ message: 'formId and data are required' })
  }

  const form = await prisma.form.findUnique({
    where: { id: body.formId },
    select: { id: true },
  })
  if (!form) {
    return reply.status(404).send({ message: 'Form not found' })
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

export async function getSubmissions(
  _req: FastifyRequest,
  _reply: FastifyReply,
) {
  return prisma.submission.findMany({
    include: { form: true },
  })
}
