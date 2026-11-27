'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Calendar,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MessageSquare,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  AiProviderPreference,
  AiSearchCacheStats,
  AiSearchConfig,
  AiSearchSecretStatus,
  SermonVault,
} from '@/types'
import {
  clearAiKeyOverrideAction,
  clearAiSearchCacheAction,
  saveAiKeyOverrideAction,
  updateAiSearchConfigAction,
} from '@/app/actions/sermon-ai-actions'
import { Button } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import { formatCount, formatDate } from '@/lib/dashboard/format'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'

interface AiSearchSettingsTabProps {
  sermons: SermonVault[]
  aiConfig: AiSearchConfig
  secretStatus: AiSearchSecretStatus
  cacheStats: AiSearchCacheStats
  onConfigUpdated: (nextConfig: AiSearchConfig) => void
  onSecretStatusUpdated: (nextStatus: AiSearchSecretStatus) => void
  onCacheCleared: (nextStats: AiSearchCacheStats) => void
}

function getSermonYear(datePreached?: string): number | null {
  if (!datePreached) return null
  const match = datePreached.match(/^(\d{4})/)
  return match ? Number(match[1]) : null
}

function formatDateTimeLabel(iso?: string): string {
  if (!iso) return 'Not saved yet'
  const datePart = iso.slice(0, 10)
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  const timePart = parsed.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${formatDate(datePart)} · ${timePart}`
}

export default function AiSearchSettingsTab({
  sermons,
  aiConfig,
  secretStatus,
  cacheStats,
  onConfigUpdated,
  onSecretStatusUpdated,
  onCacheCleared,
}: AiSearchSettingsTabProps) {
  const router = useRouter()

  // Config form state
  const [enabled, setEnabled] = useState(aiConfig.enabled)
  const [showFloatingButton, setShowFloatingButton] = useState(aiConfig.showFloatingButton)
  const [buttonLabel, setButtonLabel] = useState(aiConfig.buttonLabel)
  const [heading, setHeading] = useState(aiConfig.heading)
  const [subtitle, setSubtitle] = useState(aiConfig.subtitle)
  const [placeholder, setPlaceholder] = useState(aiConfig.placeholder)
  const [greeting, setGreeting] = useState(aiConfig.greeting)
  const [excerptWords, setExcerptWords] = useState(String(aiConfig.excerptWords))
  const [maxSuggestions, setMaxSuggestions] = useState(String(aiConfig.maxSuggestions))
  const [suggestionsText, setSuggestionsText] = useState((aiConfig.suggestions || []).join('\n'))
  const [dailyLimit, setDailyLimit] = useState(String(aiConfig.dailyLimit))
  const [hourlySearchLimit, setHourlySearchLimit] = useState(String(aiConfig.hourlySearchLimit))
  const [hourlyChatLimit, setHourlyChatLimit] = useState(String(aiConfig.hourlyChatLimit))
  const [hiddenYears, setHiddenYears] = useState<number[]>(aiConfig.hiddenYears || [])
  const [providerPreference, setProviderPreference] = useState<AiProviderPreference>(
    aiConfig.providerPreference
  )
  const [savingConfig, setSavingConfig] = useState(false)

  // Encrypted key override state (write-only — plaintext never loaded from server)
  const [overrideProvider, setOverrideProvider] = useState<'gemini' | 'openai'>(
    secretStatus.overrideProvider ||
      (aiConfig.providerPreference === 'openai' ? 'openai' : 'gemini')
  )
  const [overrideApiKey, setOverrideApiKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [confirmClearKeyOpen, setConfirmClearKeyOpen] = useState(false)
  const [clearingKey, setClearingKey] = useState(false)

  // Cache clearing state
  const [confirmClearCacheOpen, setConfirmClearCacheOpen] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)

  useEffect(() => {
    setEnabled(aiConfig.enabled)
    setShowFloatingButton(aiConfig.showFloatingButton)
    setButtonLabel(aiConfig.buttonLabel)
    setHeading(aiConfig.heading)
    setSubtitle(aiConfig.subtitle)
    setPlaceholder(aiConfig.placeholder)
    setGreeting(aiConfig.greeting)
    setExcerptWords(String(aiConfig.excerptWords))
    setMaxSuggestions(String(aiConfig.maxSuggestions))
    setSuggestionsText((aiConfig.suggestions || []).join('\n'))
    setDailyLimit(String(aiConfig.dailyLimit))
    setHourlySearchLimit(String(aiConfig.hourlySearchLimit))
    setHourlyChatLimit(String(aiConfig.hourlyChatLimit))
    setHiddenYears(aiConfig.hiddenYears || [])
    setProviderPreference(aiConfig.providerPreference)
  }, [aiConfig])

  const sermonYearStats = useMemo(() => {
    const counts = new Map<number, { total: number; published: number }>()
    for (const sermon of sermons) {
      const yr = getSermonYear(sermon.datePreached)
      if (!yr) continue
      const current = counts.get(yr) ?? { total: 0, published: 0 }
      current.total += 1
      if (sermon.isPublished !== false) current.published += 1
      counts.set(yr, current)
    }
    for (const yr of hiddenYears) {
      if (!counts.has(yr)) counts.set(yr, { total: 0, published: 0 })
    }
    return Array.from(counts.entries())
      .map(([year, stats]) => ({ year, ...stats }))
      .sort((a, b) => b.year - a.year)
  }, [sermons, hiddenYears])

  const parsedSuggestionLines = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const line of suggestionsText.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const lower = trimmed.toLowerCase()
      if (seen.has(lower)) continue
      seen.add(lower)
      list.push(trimmed)
    }
    return list
  }, [suggestionsText])

  const usedToday = aiConfig.dailyUsageCount ?? 0
  const safeDailyLimit = Math.max(1, aiConfig.dailyLimit || 1)
  const usagePercent = Math.min(100, Math.round((usedToday / safeDailyLimit) * 100))

  const toggleYearVisibility = (year: number) => {
    setHiddenYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year].sort((a, b) => b - a)
    )
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingConfig) return

    const excerptNum = Number(excerptWords)
    const maxSugNum = Number(maxSuggestions)
    const dailyNum = Number(dailyLimit)
    const hourlySearchNum = Number(hourlySearchLimit)
    const hourlyChatNum = Number(hourlyChatLimit)

    if (!Number.isFinite(excerptNum) || excerptNum < 0 || excerptNum > 64) {
      toastError('Excerpt word count must be between 0 and 64.')
      return
    }
    if (!Number.isFinite(maxSugNum) || maxSugNum < 1 || maxSugNum > 200) {
      toastError('Maximum suggestions must be between 1 and 200.')
      return
    }
    if (!Number.isFinite(dailyNum) || dailyNum < 0 || dailyNum > 50_000) {
      toastError('Daily limit must be between 0 and 50,000.')
      return
    }
    if (!Number.isFinite(hourlySearchNum) || hourlySearchNum < 1 || hourlySearchNum > 500) {
      toastError('Hourly page search limit must be between 1 and 500.')
      return
    }
    if (!Number.isFinite(hourlyChatNum) || hourlyChatNum < 1 || hourlyChatNum > 500) {
      toastError('Hourly modal limit must be between 1 and 500.')
      return
    }

    setSavingConfig(true)
    try {
      const res = await updateAiSearchConfigAction({
        enabled,
        showFloatingButton,
        buttonLabel: buttonLabel.trim(),
        heading: heading.trim(),
        subtitle: subtitle.trim(),
        placeholder: placeholder.trim(),
        greeting: greeting.trim(),
        excerptWords: Math.round(excerptNum),
        maxSuggestions: Math.round(maxSugNum),
        suggestions: parsedSuggestionLines.slice(0, Math.round(maxSugNum)),
        dailyLimit: Math.round(dailyNum),
        hourlySearchLimit: Math.round(hourlySearchNum),
        hourlyChatLimit: Math.round(hourlyChatNum),
        hiddenYears,
        providerPreference,
      })

      if (res.success && res.aiConfig) {
        toastSuccess('AI Search settings saved.')
        if (res.warning) toast.info(res.warning)
        onConfigUpdated(res.aiConfig)
        router.refresh()
      } else {
        toastError(res.error || 'Failed to save AI Search settings.')
      }
    } catch {
      toastError('Unexpected error while saving AI Search settings.')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSaveKeyOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingKey) return

    const trimmed = overrideApiKey.trim()
    if (trimmed.length < 16 || /\s/.test(trimmed)) {
      toastError('Enter a valid API key (at least 16 characters, no spaces).')
      return
    }

    setSavingKey(true)
    try {
      const res = await saveAiKeyOverrideAction({
        provider: overrideProvider,
        apiKey: trimmed,
      })
      if (res.success && res.secretStatus) {
        toastSuccess('Encrypted AI key override saved safely as a Sanity draft.')
        if (res.warning) toast.info(res.warning)
        onSecretStatusUpdated(res.secretStatus)
        setOverrideApiKey('')
        setShowKeyInput(false)
        router.refresh()
      } else {
        toastError(res.error || 'Failed to save encrypted AI key.')
      }
    } catch {
      toastError('Unexpected error while encrypting and saving API key.')
    } finally {
      setSavingKey(false)
    }
  }

  const handleConfirmClearKey = async () => {
    if (clearingKey) return
    setClearingKey(true)
    try {
      const res = await clearAiKeyOverrideAction()
      if (res.success && res.secretStatus) {
        toastSuccess('Encrypted dashboard key override removed.')
        if (res.warning) toast.info(res.warning)
        onSecretStatusUpdated(res.secretStatus)
        setConfirmClearKeyOpen(false)
        router.refresh()
      } else {
        toastError(res.error || 'Failed to remove key override.')
      }
    } catch {
      toastError('Unexpected error while removing key override.')
    } finally {
      setClearingKey(false)
    }
  }

  const handleConfirmClearCache = async () => {
    if (clearingCache) return
    setClearingCache(true)
    try {
      const res = await clearAiSearchCacheAction()
      if (res.success) {
        toastSuccess(
          `Cleared ${formatCount(res.clearedCount)} saved ${res.clearedCount === 1 ? 'search' : 'searches'}.`
        )
        if (res.warning) toast.info(res.warning)
        onCacheCleared(res.cacheStats)
        setConfirmClearCacheOpen(false)
        router.refresh()
      } else {
        toastError(res.error || 'Failed to clear saved AI Search cache.')
      }
    } catch {
      toastError('Unexpected error while clearing AI Search cache.')
    } finally {
      setClearingCache(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. AI Provider & Key Security Card */}
      <section
        aria-labelledby="ai-key-security-heading"
        className="space-y-5 rounded-[var(--radius-card)] bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <h2
                id="ai-key-security-heading"
                className="font-sans text-lg font-semibold text-foreground"
              >
                AI Provider &amp; API Key Security
              </h2>
            </div>
            <p className="max-w-[75ch] text-sm leading-relaxed text-muted-foreground">
              For maximum speed and zero CMS exposure, set{' '}
              <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-foreground">
                GEMINI_API_KEY
              </code>{' '}
              or{' '}
              <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-foreground">
                OPENAI_API_KEY
              </code>{' '}
              in Vercel environment variables. You can also save an optional write-only key override
              here—it is encrypted with AES-256-GCM into an unpublished draft and never sent back
              to any browser.
            </p>
          </div>

          {secretStatus.activeSource === 'env' ? (
            <StatusBadge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              Server Env ({secretStatus.activeProvider.toUpperCase()})
            </StatusBadge>
          ) : secretStatus.activeSource === 'dashboard_override' ? (
            <StatusBadge variant="primary" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              Encrypted Override · ••••{secretStatus.maskedOverrideTail || '****'}
            </StatusBadge>
          ) : (
            <StatusBadge variant="warning">Semantic / Keyword Fallback Only</StatusBadge>
          )}
        </div>

        {/* Live Status Summary Strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-control)] bg-surface-raised p-3.5">
            <span className="block text-[13px] font-medium text-muted-foreground">
              Server Environment
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {secretStatus.hasEnvGemini && secretStatus.hasEnvOpenAI
                ? 'Gemini + OpenAI configured'
                : secretStatus.hasEnvGemini
                  ? 'Gemini env key active'
                  : secretStatus.hasEnvOpenAI
                    ? 'OpenAI env key active'
                    : 'No server env key set'}
            </p>
          </div>

          <div className="rounded-[var(--radius-control)] bg-surface-raised p-3.5">
            <span className="block text-[13px] font-medium text-muted-foreground">
              Encrypted Draft Override
            </span>
            <p className="mt-1 font-sans text-sm font-semibold text-foreground tabular-nums">
              {secretStatus.hasDashboardOverride
                ? `${(secretStatus.overrideProvider || 'gemini').toUpperCase()} · ••••${secretStatus.maskedOverrideTail || '****'}`
                : 'None stored'}
            </p>
          </div>

          <div className="rounded-[var(--radius-control)] bg-surface-raised p-3.5">
            <span className="block text-[13px] font-medium text-muted-foreground">
              Search Without AI Key
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Sanity Dataset Embeddings + Keyword Ready
            </p>
          </div>
        </div>

        {/* Encrypted Key Override Form */}
        <form
          onSubmit={handleSaveKeyOverride}
          className="space-y-4 rounded-[var(--radius-control)] border border-border/70 bg-background/50 p-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="ai-override-provider" className="text-sm font-semibold">
                Override Provider
              </Label>
              <Select
                value={overrideProvider}
                onValueChange={(val) => setOverrideProvider(val as 'gemini' | 'openai')}
              >
                <SelectTrigger id="ai-override-provider" className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-override-key" className="text-sm font-semibold">
                Encrypted Key Override (Write-Only)
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    id="ai-override-key"
                    type={showKeyInput ? 'text' : 'password'}
                    value={overrideApiKey}
                    onChange={(e) => setOverrideApiKey(e.target.value)}
                    placeholder="Paste new API key to encrypt and save…"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby="ai-override-key-help"
                    disabled={savingKey}
                    className="bg-card pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyInput((prev) => !prev)}
                    aria-pressed={showKeyInput}
                    aria-label={showKeyInput ? 'Hide API key input' : 'Show API key input'}
                    className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showKeyInput ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={savingKey || overrideApiKey.trim().length < 16}
                  aria-busy={savingKey || undefined}
                  className="min-h-11 shrink-0 gap-2 md:min-h-10"
                >
                  {savingKey ? (
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{savingKey ? 'Encrypting…' : 'Save encrypted key'}</span>
                </Button>

                {secretStatus.hasDashboardOverride && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmClearKeyOpen(true)}
                    disabled={savingKey || clearingKey}
                    className="min-h-11 shrink-0 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive md:min-h-10"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Clear override</span>
                  </Button>
                )}
              </div>
              <p id="ai-override-key-help" className="text-[13px] text-muted-foreground">
                Encrypted server-side with AES-256-GCM into{' '}
                <code className="font-mono text-xs">drafts.aiSearchSecret</code>. Server environment
                keys still take priority for the same provider.
              </p>
            </div>
          </div>
        </form>
      </section>

      {/* 2. AI Search Configuration Form */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        {/* Controls, Quotas & Guardrails */}
        <section
          aria-labelledby="ai-controls-heading"
          className="space-y-5 rounded-[var(--radius-card)] bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <h2
                  id="ai-controls-heading"
                  className="font-sans text-lg font-semibold text-foreground"
                >
                  AI Search Status, Quotas &amp; Safety
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                The AI only selects verified ECCF sermons and timestamps; visitors never see
                raw AI-written prose, and crisis prompts automatically show ECCF care contacts + 112.
              </p>
            </div>

            <StatusBadge variant={enabled ? 'success' : 'neutral'}>
              {enabled ? 'AI Search On' : 'Paused (Keyword Only)'}
            </StatusBadge>
          </div>

          {/* Daily Usage Meter */}
          <div className="space-y-2 rounded-[var(--radius-control)] bg-surface-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">
                AI searches today (including floating modal)
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatCount(usedToday)} of {formatCount(aiConfig.dailyLimit)}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={usedToday}
              aria-valuemin={0}
              aria-valuemax={safeDailyLimit}
              aria-label="Daily AI search usage"
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  usagePercent >= 90 ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-[13px] text-muted-foreground">
              Cached repeat searches do not count toward daily usage. Once the daily cap is reached,
              visitors seamlessly fall back to exact keyword search.
            </p>
          </div>

          {/* Feature Switches */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border/70 bg-background/50 p-3.5">
              <label htmlFor="ai-config-enabled" className="flex-1 cursor-pointer space-y-0.5">
                <span className="block text-sm font-semibold text-foreground">
                  Let visitors search with AI
                </span>
                <span className="block text-[13px] text-muted-foreground">
                  Show AI Message Finder on homepage, /sermons, and floating modal.
                </span>
              </label>
              <Checkbox
                id="ai-config-enabled"
                checked={enabled}
                onCheckedChange={(val) => setEnabled(Boolean(val))}
                className="h-5 w-5"
              />
            </div>

            <div className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border/70 bg-background/50 p-3.5">
              <label htmlFor="ai-config-fab" className="flex-1 cursor-pointer space-y-0.5">
                <span className="block text-sm font-semibold text-foreground">
                  Show floating AI Search button
                </span>
                <span className="block text-[13px] text-muted-foreground">
                  Auto-hides whenever an inline AI Search card is scrolled into view.
                </span>
              </label>
              <Checkbox
                id="ai-config-fab"
                checked={showFloatingButton}
                onCheckedChange={(val) => setShowFloatingButton(Boolean(val))}
                className="h-5 w-5"
              />
            </div>
          </div>

          {/* Numeric Limits & Provider Preference */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="ai-provider-pref" className="text-sm font-semibold">
                Provider Preference
              </Label>
              <Select
                value={providerPreference}
                onValueChange={(val) => setProviderPreference(val as AiProviderPreference)}
              >
                <SelectTrigger id="ai-provider-pref" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Env First)</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-daily-limit" className="text-sm font-semibold">
                Daily Global Limit
              </Label>
              <Input
                id="ai-daily-limit"
                type="number"
                min={0}
                max={50000}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="bg-background tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-hourly-page" className="text-sm font-semibold">
                Page Limit / Hr
              </Label>
              <Input
                id="ai-hourly-page"
                type="number"
                min={1}
                max={500}
                value={hourlySearchLimit}
                onChange={(e) => setHourlySearchLimit(e.target.value)}
                className="bg-background tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-hourly-modal" className="text-sm font-semibold">
                Modal Limit / Hr
              </Label>
              <Input
                id="ai-hourly-modal"
                type="number"
                min={1}
                max={500}
                value={hourlyChatLimit}
                onChange={(e) => setHourlyChatLimit(e.target.value)}
                className="bg-background tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-excerpt-words" className="text-sm font-semibold">
                Excerpt Words (0–64)
              </Label>
              <Input
                id="ai-excerpt-words"
                type="number"
                min={0}
                max={64}
                value={excerptWords}
                onChange={(e) => setExcerptWords(e.target.value)}
                className="bg-background tabular-nums"
              />
            </div>
          </div>

          {/* Visible Sermon Years */}
          {sermonYearStats.length > 0 && (
            <div className="space-y-2 border-t border-border/70 pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">
                  Visible Sermon Years
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground">
                Unchecking a year hides its sermons from public listings, keyword search, and AI
                search while preserving all records and transcripts here.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {sermonYearStats.map(({ year, total, published }) => {
                  const isVisible = !hiddenYears.includes(year)
                  const checkboxId = `sermon-year-${year}`
                  return (
                    <label
                      key={year}
                      htmlFor={checkboxId}
                      className={cn(
                        'inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border px-3.5 py-2 text-sm transition-colors md:min-h-10',
                        isVisible
                          ? 'border-primary/40 bg-primary/5 text-foreground'
                          : 'border-border bg-surface-raised text-muted-foreground'
                      )}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={isVisible}
                        onCheckedChange={() => toggleYearVisibility(year)}
                      />
                      <span className="font-semibold tabular-nums">{year}</span>
                      <span className="text-[13px] text-muted-foreground tabular-nums">
                        ({formatCount(published)}/{formatCount(total)})
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Public Copy & Starter Suggestions */}
        <section
          aria-labelledby="ai-copy-heading"
          className="space-y-5 rounded-[var(--radius-card)] bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <h2 id="ai-copy-heading" className="font-sans text-lg font-semibold text-foreground">
                Public Copy &amp; Suggested Prompts Pool
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Customize the invitation card, floating button greeting, and rotating prompt chips.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ai-heading" className="text-sm font-semibold">
                Inline Card Heading
              </Label>
              <Input
                id="ai-heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-button-label" className="text-sm font-semibold">
                Floating Button &amp; Modal Title
              </Label>
              <Input
                id="ai-button-label"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ai-subtitle" className="text-sm font-semibold">
                Inline Card Subtitle
              </Label>
              <Input
                id="ai-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-placeholder" className="text-sm font-semibold">
                Input Example Placeholder
              </Label>
              <Input
                id="ai-placeholder"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-max-suggestions" className="text-sm font-semibold">
                Max Suggestions Cap (1–200)
              </Label>
              <Input
                id="ai-max-suggestions"
                type="number"
                min={1}
                max={200}
                value={maxSuggestions}
                onChange={(e) => setMaxSuggestions(e.target.value)}
                className="bg-background tabular-nums"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ai-greeting" className="text-sm font-semibold">
                Modal Greeting
              </Label>
              <textarea
                id="ai-greeting"
                rows={2}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="flex min-h-[72px] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="ai-suggestions-pool" className="text-sm font-semibold">
                  Starter Suggestions (One per line)
                </Label>
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  {formatCount(parsedSuggestionLines.length)} unique prompts (/sermons shows 5,
                  modal shows 4)
                </span>
              </div>
              <textarea
                id="ai-suggestions-pool"
                rows={6}
                value={suggestionsText}
                onChange={(e) => setSuggestionsText(e.target.value)}
                placeholder="One prompt per line..."
                className="flex min-h-[144px] w-full rounded-[var(--radius-control)] border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={savingConfig}
              aria-busy={savingConfig || undefined}
              className="min-h-11 gap-2 px-5 md:min-h-10"
            >
              {savingConfig ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{savingConfig ? 'Saving settings…' : 'Save AI Search Settings'}</span>
            </Button>
          </div>
        </section>
      </form>

      {/* 3. Saved Searches Persistent Cache Card */}
      <section
        aria-labelledby="ai-cache-heading"
        className="space-y-4 rounded-[var(--radius-card)] bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <h2 id="ai-cache-heading" className="font-sans text-lg font-semibold text-foreground">
                Saved Searches Cache
              </h2>
            </div>
            <p className="max-w-[75ch] text-sm text-muted-foreground">
              Queries are keyed by an anonymous SHA-256 hash—raw visitor search phrases are never
              logged in Sanity. Repeat searches return saved answers instantly without using AI.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmClearCacheOpen(true)}
            disabled={clearingCache}
            className="min-h-11 shrink-0 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive md:min-h-10"
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Clear saved cache</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-control)] bg-surface-raised p-3.5">
            <span className="block text-[13px] font-medium text-muted-foreground">
              Saved Entries
            </span>
            <p className="mt-1 font-sans text-lg font-semibold text-foreground tabular-nums">
              {formatCount(cacheStats.totalEntries)}
            </p>
          </div>
          <div className="rounded-[var(--radius-control)] bg-surface-raised p-3.5">
            <span className="block text-[13px] font-medium text-muted-foreground">
              Cache Reuses
            </span>
            <p className="mt-1 font-sans text-lg font-semibold text-foreground tabular-nums">
              {formatCount(cacheStats.totalReuses)}
            </p>
          </div>
          <div className="rounded-[var(--radius-control)] bg-surface-raised p-3.5">
            <span className="block text-[13px] font-medium text-muted-foreground">
              Oldest Saved Entry
            </span>
            <p className="mt-1 font-sans text-sm font-semibold text-foreground tabular-nums">
              {formatDateTimeLabel(cacheStats.oldestSavedAt)}
            </p>
          </div>
        </div>

        {cacheStats.staleChangeCount > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius-control)] border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <span className="tabular-nums">
              <strong>{formatCount(cacheStats.staleChangeCount)}</strong>{' '}
              {cacheStats.staleChangeCount === 1
                ? 'sermon or transcript was added or updated'
                : 'sermons or transcripts were added or updated'}{' '}
              since the oldest search was cached. Clear the cache so repeat queries see the newest
              messages.
            </span>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmClearKeyOpen}
        onOpenChange={setConfirmClearKeyOpen}
        tone="destructive"
        title="Remove encrypted AI key override?"
        description="Deletes drafts.aiSearchSecret from Sanity."
        effectSummary="AI Search will fall back to server environment keys (if configured) or semantic/keyword search without LLM reranking."
        confirmLabel="Remove override"
        loading={clearingKey}
        loadingLabel="Removing…"
        onConfirm={handleConfirmClearKey}
      />

      <ConfirmDialog
        open={confirmClearCacheOpen}
        onOpenChange={setConfirmClearCacheOpen}
        tone="destructive"
        title="Clear all saved AI searches?"
        description="Purges cached query hashes from Sanity and the hot in-memory LRU cache."
        effectSummary="Fresh searches will re-evaluate newly uploaded sermons and transcripts immediately."
        confirmLabel="Clear cache"
        loading={clearingCache}
        loadingLabel="Clearing…"
        onConfirm={handleConfirmClearCache}
      />
    </div>
  )
}
