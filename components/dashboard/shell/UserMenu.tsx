/**
 * UserMenu — top-bar account menu: role badge, operational team, profile picture management,
 * PWA install control, public site link, theme toggle, and Clerk authenticated Sign out.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Camera,
  ChevronDown,
  ExternalLink,
  Loader2,
  LogOut,
  Moon,
  Shield,
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
          <button
            type="button"
            className="group flex h-9.5 items-center gap-2 rounded-full border border-border/60 bg-muted/40 pl-1.5 pr-2.5 text-left shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-border hover:bg-accent/60 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-primary/40 data-[state=open]:bg-accent/80"
            aria-label={`Account menu, signed in as ${displayName}`}
          >
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border/80 bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-primary-foreground shadow-2xs">
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
                <UserRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              )}
            </span>
            <span className="hidden max-w-[135px] truncate text-[13px] font-medium text-foreground tracking-tight sm:inline">
              {displayName}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 group-hover:text-foreground"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[320px] rounded-2xl border border-border/80 bg-popover/95 p-2 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-muted/60 via-muted/30 to-muted/10 p-3.5 shadow-2xs">
              {/* Subtle ambient accent glow */}
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
                aria-hidden="true"
              />

              <div className="relative flex items-center gap-3">
                <div className="group/avatar relative shrink-0">
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/25 bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-primary-foreground shadow-xs">
                    {currentPhoto && !imgError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentPhoto}
                        alt={displayName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
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
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-xs transition-all duration-200 group-hover/avatar:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title="Change profile picture"
                    aria-label="Change profile picture"
                  >
                    <Camera className="h-4 w-4 drop-shadow-md" aria-hidden="true" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  {name && (
                    <p className="truncate text-sm font-semibold text-foreground tracking-tight">
                      {name}
                    </p>
                  )}
                  {email && (
                    <p className="truncate text-xs text-muted-foreground font-normal mt-0.5">
                      {email}
                    </p>
                  )}
                </div>
              </div>

              {/* Leadership Role / Team Badges */}
              <div className="relative mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-2xs">
                  <Shield className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[210px]">
                    {getLeaderPostTitle({ role, excoPosition, team, teams })}
                  </span>
                </span>

                {excoPosition &&
                  displayTeam &&
                  displayTeam.toLowerCase() !==
                    getLeaderPostTitle({ role, excoPosition, team, teams }).toLowerCase() &&
                  displayTeam.toLowerCase() !== 'exco' && (
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {displayTeam}
                    </span>
                  )}
              </div>

              {teams && teams.length > 1 && (
                <div className="relative mt-2 flex flex-wrap gap-1">
                  {teams.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-md border border-border/40 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </DropdownMenuLabel>

          <div className="space-y-0.5 pt-1.5">
            <DropdownMenuItem
              onSelect={() => setIsDialogOpen(true)}
              className="group flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent focus:bg-accent data-[highlighted]:bg-accent"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary group-data-[highlighted]:bg-primary/10 group-data-[highlighted]:text-primary">
                <Camera className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="flex-1 text-[13px] text-foreground font-medium">Change profile picture</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={toggleTheme}
              className="group flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent focus:bg-accent data-[highlighted]:bg-accent"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-warning/15 group-hover:text-warning group-data-[highlighted]:bg-warning/15 group-data-[highlighted]:text-warning">
                {isDark ? (
                  <Sun className="h-4 w-4 text-warning" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <span className="flex-1 text-[13px] text-foreground font-medium">
                {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              </span>
              <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </DropdownMenuItem>

            <InstallPwaButton
              variant="menu"
              onOpenGuide={(isIos) => {
                setMenuOpen(false)
                setInstallGuide({ open: true, isIos })
              }}
            />

            <DropdownMenuItem
              asChild
              className="group flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent focus:bg-accent data-[highlighted]:bg-accent"
            >
              <a href="/" target="_blank" rel="noopener noreferrer">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary group-data-[highlighted]:bg-primary/10 group-data-[highlighted]:text-primary">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="flex-1 text-[13px] text-foreground font-medium">View public site</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground group-data-[highlighted]:text-foreground" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 bg-border/60" />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="group flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors group-hover:bg-destructive/20 group-data-[highlighted]:bg-destructive/20">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="flex-1 text-[13px] font-medium text-destructive">Sign out</span>
            </DropdownMenuItem>

            {devTools && (
              <>
                <DropdownMenuSeparator className="my-1.5 bg-border/60" />
                {devTools}
              </>
            )}
          </div>
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
