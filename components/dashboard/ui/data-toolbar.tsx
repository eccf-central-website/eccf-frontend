'use client'

import * as React from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/dashboard/ui/sheet'

export interface ActiveFilterChip {
  id: string
  label: string
  /** Optional selected value displayed alongside the label. */
  value?: string
  onRemove: () => void
  removeAriaLabel?: string
}

export interface DataToolbarProps {
  /** Controlled search query string. Provide with `onSearchChange` to show search. */
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /** Accessible label for the search input (linked via htmlFor). */
  searchLabel?: string
  /** Explicit id for the search input; defaults to a stable generated id. */
  searchId?: string
  /** Render the search label visibly above the input instead of sr-only. */
  showSearchLabel?: boolean

  /** Inline filter controls shown on md+ screens and reused in mobile Sheet unless `mobileFilters` is passed. */
  filters?: React.ReactNode
  /** Optional mobile-specific stacked layout for the bottom filter Sheet. */
  mobileFilters?: React.ReactNode
  /** Number of active filters for the mobile Filters button badge. */
  activeFilterCount?: number
  /** Removable chips shown under the main toolbar row when filters are active. */
  activeFilters?: ActiveFilterChip[]
  /** Clears all active filters (also rendered in the mobile filter Sheet footer). */
  onResetFilters?: () => void
  filterSheetTitle?: string
  filterSheetDescription?: string

  /** Right-side action controls (Export, Add, etc.). */
  actions?: React.ReactNode
  /** Freshness or count metadata displayed alongside active chips or beneath controls. */
  meta?: React.ReactNode
  className?: string
}

export function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchLabel = 'Search records',
  searchId,
  showSearchLabel = false,
  filters,
  mobileFilters,
  activeFilterCount,
  activeFilters,
  onResetFilters,
  filterSheetTitle = 'Filters',
  filterSheetDescription,
  actions,
  meta,
  className,
}: DataToolbarProps) {
  const generatedId = React.useId()
  const resolvedSearchId = searchId ?? generatedId
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const hasSearch = typeof onSearchChange === 'function'
  const hasFilters = Boolean(filters || mobileFilters)
  const resolvedFilterCount = activeFilterCount ?? activeFilters?.length ?? 0
  const hasChips = Boolean(activeFilters && activeFilters.length > 0)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
          {hasSearch && (
            <div className="min-w-0 flex-1 basis-56 sm:max-w-xs">
              <label
                htmlFor={resolvedSearchId}
                className={
                  showSearchLabel
                    ? 'mb-1.5 block text-[13px] font-medium text-foreground'
                    : 'sr-only'
                }
              >
                {searchLabel}
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id={resolvedSearchId}
                  type="text"
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={cn('pl-9', searchValue ? 'pr-11' : 'pr-3')}
                />
                {Boolean(searchValue) && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label={`Clear ${searchLabel.toLowerCase()}`}
                    className="absolute right-0.5 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:w-9"
                  >
                    <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Desktop inline filter controls */}
          {filters && (
            <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
              {filters}
            </div>
          )}

          {/* Mobile bottom Sheet trigger */}
          {hasFilters && (
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-expanded={mobileOpen}
                    className="min-h-11 gap-2 px-3.5"
                  >
                    <SlidersHorizontal
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Filters</span>
                    {resolvedFilterCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[13px] font-semibold leading-none tabular-nums text-primary-foreground">
                        {resolvedFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="flex max-h-[85dvh] flex-col gap-0 rounded-t-[var(--radius-panel)] border-t border-border bg-card p-0 text-card-foreground"
                >
                  <div
                    className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30"
                    aria-hidden="true"
                  />
                  <SheetHeader className="border-b border-border/50 px-5 pb-3 pt-3 pr-14 text-left">
                    <SheetTitle className="font-sans text-base font-semibold text-foreground">
                      {filterSheetTitle}
                    </SheetTitle>
                    <SheetDescription
                      className={
                        filterSheetDescription
                          ? 'text-sm text-muted-foreground'
                          : 'sr-only'
                      }
                    >
                      {filterSheetDescription ??
                        'Adjust filters to narrow displayed records.'}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
                    {mobileFilters ?? filters}
                  </div>

                  <SheetFooter
                    className="flex flex-row items-center gap-2 border-t border-border/50 bg-card px-5 py-4 sm:space-x-0"
                    style={{
                      paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                    }}
                  >
                    {onResetFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 flex-1"
                        onClick={() => {
                          onResetFilters()
                          setMobileOpen(false)
                        }}
                      >
                        Reset
                      </Button>
                    )}
                    <Button
                      type="button"
                      className="min-h-11 flex-1"
                      onClick={() => setMobileOpen(false)}
                    >
                      Apply
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            {actions}
          </div>
        )}
      </div>

      {(hasChips || meta) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {hasChips ? (
            <div
              className="flex flex-wrap items-center gap-1.5"
              aria-label="Active filters"
            >
              {activeFilters!.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={
                    chip.removeAriaLabel ??
                    `Remove ${chip.label}${chip.value ? `: ${chip.value}` : ''} filter`
                  }
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-pill)] bg-surface-raised px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>
                    {chip.value ? `${chip.label}: ${chip.value}` : chip.label}
                  </span>
                  <X
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              ))}
              {onResetFilters && activeFilters!.length > 1 && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Clear all
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {meta && (
            <div className="text-[13px] text-muted-foreground tabular-nums">
              {meta}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
