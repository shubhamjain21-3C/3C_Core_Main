/**
 * Canonical email form used for every identity lookup and every write.
 *
 * Identity lookups must be exact (`.eq`) — `.ilike` treats `%` and `_` in user
 * input as wildcards, which lets a crafted value match another account's row.
 * Normalising both sides to lowercase keeps matching case-insensitive without
 * pattern matching.
 */
export function normaliseEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}
