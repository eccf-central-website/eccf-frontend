/**
 * Uniform return shape for every dashboard Server Action. Client callers
 * branch on `ok` and show a success or error toast; `fieldErrors` maps
 * zod issues back onto react-hook-form fields.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
