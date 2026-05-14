import { db } from '@/lib/db'

/**
 * Verify that a user exists and has the 'admin' role.
 * Returns true if the user is an admin, false otherwise.
 */
export async function verifyAdmin(userId: string): Promise<boolean> {
  if (!userId) return false
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === 'admin'
}
