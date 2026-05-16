import { db } from '@/lib/db'

export interface AuditLogEntry {
  adminId: string
  action: string
  targetType?: string
  targetId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  outcome?: 'success' | 'failed' | 'denied'
}

/**
 * Log an admin action to the audit log
 * This should be called for all significant admin operations
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        targetType: entry.targetType || null,
        targetId: entry.targetId || null,
        details: entry.details || null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        outcome: entry.outcome || 'success',
      },
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Get recent audit logs for an admin user
 */
export async function getAdminAuditLogs(
  adminId: string,
  limit: number = 50
) {
  return db.adminAuditLog.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get failed login attempts in the last hour
 */
export async function getRecentFailedLogins(
  email: string,
  windowMinutes: number = 60
): Promise<number> {
  const cutoff = new Date()
  cutoff.setMinutes(cutoff.getMinutes() - windowMinutes)

  const count = await db.adminAuditLog.count({
    where: {
      action: 'LOGIN_ATTEMPT',
      outcome: 'failed',
      details: { contains: email },
      createdAt: { gte: cutoff },
    },
  })

  return count
}

/**
 * Get all audit logs (for superadmin dashboard)
 */
export async function getAllAuditLogs(
  options?: {
    limit?: number
    offset?: number
    action?: string
    outcome?: string
  }
) {
  const { limit = 100, offset = 0, action, outcome } = options || {}

  const where: Record<string, any> = {}
  if (action) where.action = action
  if (outcome) where.outcome = outcome

  const [logs, total] = await Promise.all([
    db.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
          },
        },
      },
    }),
    db.adminAuditLog.count({ where }),
  ])

  return { logs, total }
}
