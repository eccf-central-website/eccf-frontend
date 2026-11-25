/**
 * UserMenu — top-bar account menu: role badge, operational team, profile picture management,
 * PWA install control, public site link, theme toggle, and Clerk authenticated Sign out.
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
import InstallPwaButton, { InstallPwaGuideDialog } from '@/components/dashboard/pwa/InstallPwaButton'
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

  const [menuOpen, setMenuOpen] = useState(false)
  const [installGuide, setInstallGuide] = useState<{ open: boolean; isIos: boolean }>({
    open: false,
    isIos: false,
  })
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

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
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
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="min-h-11 gap-2 rounded-full border-0 bg-muted/50 px-2 hover:bg-muted focus-visible:ring-2 sm:min-h-10 sm:px-3"
            aria-label={`Account menu, signed in as ${displayName}`}
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
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
            <span className="hidden max-w-[150px] truncate text-sm font-medium sm:inline">
              {displayName}
            </span>
            <ChevronDown aria-hidden="true" className="hidden text-muted-foreground sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="p-3 font-normal">
            <div className="flex items-center gap-3">
              <div className="group relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
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
                  onClick={() => {
                    setMenuOpen(false)
                    setIsDialogOpen(true)
                  }}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-background/75 text-foreground opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Change profile picture"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                {name && (
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {name}
                  </span>
                )}
                {email && (
                  <span className="block truncate text-[13px] text-muted-foreground">{email}</span>
                )}
                <div className="pt-0.5">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {getLeaderPostTitle({ role, excoPosition, team, teams })}
                  </span>
                </div>
              </div>
            </div>

            {excoPosition && (
              <p className="mt-2 truncate text-[13px] text-muted-foreground">
                {displayTeam} {teams && teams.length > 1 ? 'teams' : 'team'}
              </p>
            )}

            {teams && teams.length > 1 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {teams.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-md bg-secondary/80 px-2 py-0.5 text-xs font-medium text-secondary-foreground"
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
            className="min-h-11 cursor-pointer sm:min-h-10"
          >
            <Camera aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            Change profile picture
          </DropdownMenuItem>

          <DropdownMenuItem onClick={toggleTheme} className="min-h-11 cursor-pointer sm:min-h-10">
            {isDark ? (
              <>
                <Sun aria-hidden="true" className="text-warning" />
                Switch to light theme
              </>
            ) : (
              <>
                <Moon aria-hidden="true" className="text-muted-foreground" />
                Switch to dark theme
              </>
            )}
          </DropdownMenuItem>

          <InstallPwaButton
            variant="menu"
            onOpenGuide={(isIos) => {
              setMenuOpen(false)
              setInstallGuide({ open: true, isIos })
            }}
          />

          <DropdownMenuItem asChild className="min-h-11 cursor-pointer sm:min-h-10">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              View public site
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSignOut}
            className="min-h-11 cursor-pointer text-destructive focus:text-destructive sm:min-h-10"
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

      <InstallPwaGuideDialog
        open={installGuide.open}
        onOpenChange={(open) => setInstallGuide((prev) => ({ ...prev, open }))}
        isIos={installGuide.isIos}
      />

      {/* Change Profile Picture Modal */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a clear portrait or headshot. This photo is displayed on your dashboard and
              official fellowship records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Avatar Preview Area */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative h-28 w-28 overflow-hidden rounded-full bg-muted ring-2 ring-primary/25">
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
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-semibold text-primary">
                    {initials || <UserRound className="h-10 w-10 text-primary/70" aria-hidden="true" />}
                  </div>
                )}

                {selectedFile && !isUploading && (
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="absolute right-0.5 top-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Remove selected photo"
                    aria-label="Remove selected photo"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {selectedFile && (
                <div className="text-center">
                  <p className="max-w-[240px] truncate text-[13px] font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
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
              aria-label="Choose profile picture file"
              onChange={handleInputChange}
            />

            {/* Upload / Dropzone Box */}
            <button
              type="button"
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/40'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {selectedFile ? 'Choose a different photo' : 'Click to select or drag and drop'}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  JPG, PNG, or WebP up to 10MB (automatically compressed)
                </p>
              </div>
            </button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCloseDialog(false)}
              disabled={isUploading}
              className="min-h-11 sm:min-h-10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePhoto}
              disabled={!selectedFile || isUploading}
              className="min-h-11 gap-2 sm:min-h-10"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
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
