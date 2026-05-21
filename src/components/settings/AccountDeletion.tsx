'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AccountDeletionProps {
  onSuccess?: () => void
}

export default function AccountDeletion({ onSuccess }: AccountDeletionProps) {
  const { currentUser, logout } = useAppStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE' || !password) {
      toast.error('Please type DELETE and enter your password')
      return
    }

    setIsDeleting(true)
    try {
      // Verify password first
      const loginRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: currentUser?.email,
          password,
        }),
      })

      if (!loginRes.ok) {
        toast.error('Incorrect password')
        return
      }

      // Delete account
      const deleteRes = await fetch(`/api/users/${currentUser?.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      })

      if (deleteRes.ok) {
        setSuccess(true)
        toast.success('Account deletion scheduled')
        
        // Logout after 3 seconds
        setTimeout(() => {
          logout()
          onSuccess?.()
        }, 3000)
      } else {
        const data = await deleteRes.json()
        toast.error(data.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Account deletion error:', error)
      toast.error('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#0B0B2A] mb-2">
          Account Deletion Scheduled
        </h3>
        <p className="text-sm text-[#4A5568] mb-4">
          Your account will be permanently deleted in 30 days. You can cancel this by logging in before then.
        </p>
        <p className="text-xs text-gray-400">
          Redirecting to login...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
        <div className="flex gap-3">
          <AlertTriangle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800 mb-1">Danger Zone</h4>
            <p className="text-sm text-red-700">
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => setDeleteDialogOpen(true)}
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
      >
        <Trash2 className="size-4 mr-2" />
        Delete My Account
      </Button>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <p className="font-medium mb-2">What will be deleted:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All your posts and photos</li>
                <li>Your profile and followers</li>
                <li>Messages and conversations</li>
                <li>Itineraries and bookmarks</li>
                <li>All other associated data</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <strong>DELETE</strong> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-password">Enter your password</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="h-11"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmText !== 'DELETE' || !password}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
