import type { FastifyReply, FastifyRequest } from 'fastify'

export type JwtUser = { id: string; email: string }

export async function requireJwtUser(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({ message: 'Please sign in to continue.' })
  }
}

export function jwtUser(request: FastifyRequest): JwtUser {
  return request.user as JwtUser
}
