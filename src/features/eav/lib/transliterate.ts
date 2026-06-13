/**
 * Russian (Cyrillic) -> Latin transliteration for code generation.
 * Based on common GOST-style mapping. Letters are transliterated character
 * by character; the result is then slugified (lowercase, spaces -> underscores).
 */
const RU_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

/** Transliterate Cyrillic to Latin. Non-Cyrillic characters are kept as-is. */
export function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((char) => RU_TO_LATIN[char] ?? char)
    .join('')
}

/**
 * Build a slug/code from a display name.
 * 1. Transliterate Cyrillic to Latin.
 * 2. Keep only latin letters, digits, spaces, underscores and hyphens.
 * 3. Collapse whitespace to single underscores.
 *
 * Returns an empty string when nothing usable remains
 * (e.g. input consists only of symbols/emoji).
 */
export function slugifyCode(name: string): string {
  const slug = transliterate(name)
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return slug
}
