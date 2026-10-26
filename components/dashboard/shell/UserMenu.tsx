/**
 * UserMenu — top-bar account menu: role badge, operational team, profile picture management,
 * public site link, theme toggle, and Clerk authenticated Sign out.
 *
 * Displays authenticated user's name, primary email, role badge,
 * official leadership title ([excoPosition] without em-dash), and operational teams.
 * Allows executives to view and update their official profile picture directly.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  ChevronDown,
  ExternalLink,
  Loader2,
  LogOut,
  Moon,
  Sun,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { toast } from 'sonner'
import type { WorkerRole } from '@/types'
import { ROLE_LABELS, getLeaderPostTitle } from '@/lib/dashboard/rbac'
import { Button } from '@/components/dashboard/ui/button'
import { useTheme } from '@/components/dashboard/theme/ThemeProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import { compressImage } from '@/lib/image-compression'
import { updateDashboardProfilePhotoAction } from '@/app/actions/worker-actions'

interface UserMenuProps {
  name?: string
  email?: string
  role: WorkerRole
  team: string
  teams?: string[]
  excoPosition?: string
  profileImageUrl?: string
  devTools?: React.ReactNode
}

export default function UserMenu({
  name,
  email,
  role,
  team,
  teams,
  excoPosition,
  profileImageUrl,
  devTools,
}: UserMenuProps) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useClerk()
  const isDark = theme === 'dark'

  const [currentPhoto, setCurrentPhoto] = useState<string | undefined>(profileImageUrl)
  const [imgError, setImgError] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep state synced with prop updates
  useEffect(() => {
    setCurrentPhoto(profileImageUrl)
    setImgError(false)
  }, [profileImageUrl])

  // Clean up object URLs when dialog closes or selection changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const displayTeam = teams && teams.length > 0 ? teams.join(', ') : team
  const displayName = name || excoPosition || ROLE_LABELS[role]
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: '/login' })
    } catch {
      window.location.href = '/login'
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (JPG, PNG, or WebP).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Please select a photo under 10MB.')
      return
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const resetSelection = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCloseDialog = (open: boolean) => {
    if (!open && !isUploading) {
      resetSelection()
      setIsDialogOpen(false)
    } else if (open) {
      setIsDialogOpen(true)
    }
  }

  const handleSavePhoto = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    const toastId = toast.loading('Compressing and updating profile photo...')

    try {
      // Compress image client-side to ensure crisp quality under 2MB
      const compressed = await compressImage(
        selectedFile,
        { maxWidth: 1000, maxHeight: 1000, quality: 0.85 },
        { fullName: name, team }
      )

      const result = await updateDashboardProfilePhotoAction({
        base64Image: compressed.base64,
      })

      if (result.ok) {
        if (result.data?.profileImageUrl) {
          setCurrentPhoto(result.data.profileImageUrl)
        }
        setImgError(false)
        toast.success('Profile picture updated successfully!', { id: toastId })
        resetSelection()
        setIsDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update profile picture.', { id: toastId })
      }
    } catch (err) {
      console.error('[UserMenu] Error saving profile photo:', err)
      toast.error('An unexpected error occurred while uploading your photo.', { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 gap-2 px-2 focus-visible:ring-2 sm:px-3"
            aria-label={`Account menu, signed in as ${displayName}`}
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-xs font-semibold ring-1 ring-border shadow-xs">
              {currentPhoto && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPhoto}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : initials ? (
                initials
              ) : (
                <UserRound aria-hidden="true" className="h-4 w-4 shrink-0" />
              )}
            </span>
            <span className="hidden text-sm font-medium sm:inline truncate max-w-[150px]">{displayName}</span>
            <ChevronDown aria-hidden="true" className="hidden text-muted-foreground sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="p-3 font-normal">
            <div className="flex items-center gap-3">
              <div className="relative group shrink-0">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-sm font-semibold ring-2 ring-primary/20 shadow-xs">
                  {currentPhoto && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentPhoto}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : initials ? (
                    initials
                  ) : (
                    <UserRound aria-hidden="true" className="h-5 w-5 shrink-0" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none"
                  title="Change profile picture"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                {name && <span className="block text-sm font-semibold text-foreground truncate">{name}</span>}
                {email && <span className="block text-xs text-muted-foreground truncate">{email}</span>}
                <div className="pt-0.5">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
                    {getLeaderPostTitle({ role, excoPosition, team, teams })}
                  </span>
                </div>
              </div>
            </div>

            {excoPosition && (
              <p className="mt-2 text-xs text-muted-foreground truncate">
                {displayTeam} {teams && teams.length > 1 ? 'teams' : 'team'}
              </p>
            )}

            {teams && teams.length > 1 && (
              <div className="flex flex-wrap gap-1 pt-1.5">
                {teams.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setIsDialogOpen(true)}
            className="h-10 cursor-pointer"
          >
            <Camera aria-hidden="true" className="mr-2 h-4 w-4 text-muted-foreground" />
            Change profile picture
          </DropdownMenuItem>

          <DropdownMenuItem onClick={toggleTheme} className="h-10 cursor-pointer">
            {isDark ? (
              <>
                <Sun aria-hidden="true" className="text-amber-400" />
                Switch to light theme
              </>
            ) : (
              <>
                <Moon aria-hidden="true" className="text-muted-foreground" />
                Switch to dark theme
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="h-10 cursor-pointer">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              View public site
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSignOut}
            className="h-10 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut aria-hidden="true" />
            Sign out
          </DropdownMenuItem>

          {devTools && (
            <>
              <DropdownMenuSeparator />
              {devTools}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Profile Picture Modal */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a clear portrait or headshot. This photo is displayed on your dashboard and official fellowship records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Avatar Preview Area */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-primary/30 shadow-md bg-muted">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="New preview"
                    className="h-full w-full object-cover"
                  />
                ) : currentPhoto && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPhoto}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                    {initials || <UserRound className="h-10 w-10 text-primary/60" />}
                  </div>
                )}

                {selectedFile && !isUploading && (
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 transition-colors"
                    title="Remove selected photo"
                    aria-label="Remove selected photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {selectedFile && (
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground truncate max-w-[240px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(0)} KB • Ready to save
                  </p>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleInputChange}
            />

            {/* Upload / Dropzone Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/40'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  {selectedFile ? 'Choose a different photo' : 'Click to select or drag and drop'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  JPG, PNG, or WebP up to 10MB (automatically compressed)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCloseDialog(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePhoto}
              disabled={!selectedFile || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Photo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
