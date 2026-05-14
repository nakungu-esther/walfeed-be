import type { FastifyRequest } from 'fastify'

import type { JwtUser } from './requireAuth'

/** How to scope list endpoints that support anonymous (demo) vs signed-in workspace. */
export type ListScope =
  | { kind: 'all' }
  | { kind: 'owner'; userId: string }
  | { kind: 'unauthorized' }

/**
 * No Bearer token → unscoped lists (all rows) for public demo flows.
 * Valid Bearer + JWT → only that user's rows.
 * Invalid/expired Bearer → `unauthorized` (client should clear session and retry without token).
 */
export async function resolveListScope(
  req: FastifyRequest,
): Promise<ListScope> {
  const auth = req.headers.authorization?.trim()
  if (!auth?.toLowerCase().startsWith('bearer ')) {
    return { kind: 'all' }
  }
  try {
    await req.jwtVerify()
    return { kind: 'owner', userId: (req.user as JwtUser).id }
  } catch {
    return { kind: 'unauthorized' }
  }
}
