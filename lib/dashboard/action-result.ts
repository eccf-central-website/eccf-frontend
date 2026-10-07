/**
 * Uniform return shape for every dashboard Server Action. Client callers
 * pass it to toastFromResult() (lib/dashboard/toast.ts); `fieldErrors` maps
 * zod issues back onto react-hook-form fields.
 *
 * `error` is shown to the user verbatim, so it must be curated copy: never
 * a caught exception's message and never personal data (phone/room).
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
