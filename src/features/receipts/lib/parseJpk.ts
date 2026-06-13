import { formatDateOnly } from '@/shared/lib/format'
import type { ReceiptItemCreate } from '../types'

export interface JpkParseResult {
  items: ReceiptItemCreate[]
  source: string
  receiptDate: string
  rawData: Record<string, unknown>
  notes: string
  total: number
  storeName?: string
  tin?: string
  docNumber?: string
}

const VAT_RATES: Record<string, number> = {
  A: 23,
  B: 8,
  C: 5,
  D: 0,
  F: 17,
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1]
  if (!payload) return {}
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return JSON.parse(new TextDecoder('utf-8').decode(bytes))
}

function groszyToZloty(groszy: number): number {
  return groszy / 100
}

function parseQuantity(qty: string | number): number {
  if (typeof qty === 'number') return qty
  return Number.parseFloat(qty.replace(',', '.'))
}

function getVatPercent(vatId: string, rateMap: Record<string, number>): number | undefined {
  if (rateMap[vatId] !== undefined) return rateMap[vatId]
  return VAT_RATES[vatId]
}

function buildRateMap(json: Record<string, unknown>): Record<string, number> {
  const body = (json.body as Array<Record<string, unknown>>) || []
  const rateMap: Record<string, number> = {}

  for (const entry of body) {
    if (entry.vatSummary) {
      const summary = entry.vatSummary as Record<string, unknown>
      const rates = summary.vatRatesSummary as Array<Record<string, unknown>> | undefined
      if (rates) {
        for (const r of rates) {
          const id = String(r.vatId || '')
          const rateVal = Number(r.vatRate)
          if (id && rateVal) rateMap[id] = rateVal / 100
        }
      }
    }
  }
  return rateMap
}

function buildRateMapFromJwt(jwt: Record<string, unknown>): Record<string, number> {
  const dokument = jwt.dokument as Record<string, unknown> | undefined
  const paragon = dokument?.paragon as Record<string, unknown> | undefined
  const stptu = paragon?.stPTU as Array<Record<string, unknown>> | undefined
  const rateMap: Record<string, number> = {}

  if (stptu) {
    for (const s of stptu) {
      const id = String(s.id || '')
      const val = s.wart
      if (id && typeof val === 'number') rateMap[id] = val / 100
    }
  }
  return rateMap
}

function parseJwtItems(
  jwt: Record<string, unknown>,
  rateMap: Record<string, number>,
): ReceiptItemCreate[] {
  const dokument = jwt.dokument as Record<string, unknown> | undefined
  const paragon = dokument?.paragon as Record<string, unknown> | undefined
  const pozycja = paragon?.pozycja as Array<Record<string, unknown>> | undefined
  if (!pozycja) return []

  const items: ReceiptItemCreate[] = []

  for (const entry of pozycja) {
    const towar = entry.towar as Record<string, unknown> | undefined
    if (!towar) continue

    const name = String(towar.nazwa || '')
      .trim()
      .replace(/ [ABCDEFG]$/, '')
      .trim()
    const lineBrutto = Number(towar.brutto) || 0
    const qtyRaw = towar.ilosc ?? 1
    const qty = parseQuantity(qtyRaw as string | number)
    const rabatVal = (towar.rabat as Record<string, unknown> | undefined)?.wart
    const discount = typeof rabatVal === 'number' ? groszyToZloty(Math.abs(rabatVal)) : 0
    const vatId = String(towar.idStPTU || '')
    const vatPercent = getVatPercent(vatId, rateMap)
    const unitPrice = qty > 0 ? groszyToZloty(lineBrutto / qty) : 0
    const originalTotal =
      discount > 0 ? groszyToZloty(lineBrutto + Math.abs(Number(rabatVal) || 0)) : undefined

    const item: ReceiptItemCreate = { name, price: unitPrice, qty }
    if (vatId) item.vat_rate = vatId
    if (vatPercent !== undefined) item.vat_percent = vatPercent

    if (discount > 0) {
      item.discount = discount
      item.original_total = originalTotal
    }

    items.push(item)
  }

  return items
}

export function parseJpkFile(json: Record<string, unknown>): JpkParseResult {
  const body = (json.body as Array<Record<string, unknown>>) || []

  let items: ReceiptItemCreate[] = []
  let fiscalTotal = 0
  let receiptDate = String(json.receiptDate || formatDateOnly(new Date()))
  let storeName = ''
  let tin = ''

  // Try JWT data first
  if (json.data) {
    try {
      const jwt = decodeJwtPayload(json.data as string)
      const rateMap = buildRateMapFromJwt(jwt)
      items = parseJwtItems(jwt, rateMap)

      const dokument = jwt.dokument as Record<string, unknown> | undefined
      const paragon = dokument?.paragon as Record<string, unknown> | undefined
      const podsum = paragon?.podsum as Record<string, unknown> | undefined
      const totalBrutto = Number(podsum?.sumaBrutto) || 0
      if (totalBrutto) fiscalTotal = totalBrutto

      const naglowek = dokument?.naglowek as Record<string, unknown> | undefined
      if (naglowek?.dataJPK) {
        receiptDate = String(naglowek.dataJPK).split('T')[0] ?? ''
      }

      const podmiot1 = dokument?.podmiot1 as Record<string, unknown> | undefined
      if (podmiot1) {
        storeName = String(podmiot1.nazwaPod || '')
        tin = String(podmiot1.NIP || '')
      }
    } catch {
      // fall through to body parsing
    }
  }

  // Fall back to body array
  if (items.length === 0 && body.length > 0) {
    const rateMap = buildRateMap(json)
    let i = 0

    const sumInCurrency = body.find((e) => e.sumInCurrency)?.sumInCurrency as
      | Record<string, unknown>
      | undefined
    if (sumInCurrency?.fiscalTotal) {
      fiscalTotal = Number(sumInCurrency.fiscalTotal)
    }

    while (i < body.length) {
      const entry = body[i] as Record<string, unknown> | undefined
      if (!entry) {
        i += 1
        continue
      }
      const sellLine = entry.sellLine as Record<string, unknown> | undefined

      if (sellLine) {
        const name = String(sellLine.name || '')
          .trim()
          .replace(/ [ABCDEFG]$/, '')
          .trim()
        const lineTotal = Number(sellLine.total) || 0
        const qtyRaw = sellLine.quantity ?? 1
        const qty = parseQuantity(qtyRaw as string | number)

        let effectiveTotal = lineTotal
        let discount = 0

        const nextEntry = body[i + 1]
        const discountLine = nextEntry?.discountLine as Record<string, unknown> | undefined
        if (discountLine?.isDiscount) {
          const discountValue = Number(discountLine.value) || 0
          discount = groszyToZloty(discountValue)
          effectiveTotal = lineTotal - discountValue
          i += 1
        }

        const unitPrice = qty > 0 ? groszyToZloty(effectiveTotal / qty) : 0
        const vatId = String(sellLine.vatId || '')
        const vatPercent = getVatPercent(vatId, rateMap)

        const item: ReceiptItemCreate = { name, price: unitPrice, qty }
        if (vatId) item.vat_rate = vatId
        if (vatPercent !== undefined) item.vat_percent = vatPercent
        if (discount > 0) {
          item.discount = discount
          item.original_total = groszyToZloty(lineTotal)
        }
        items.push(item)
      }

      i += 1
    }
  }

  const header = (json.header as Array<Record<string, unknown>>) || []
  let docNumber = ''

  if (Array.isArray(header)) {
    for (const h of header) {
      if (h.headerData) {
        const hd = h.headerData as Record<string, unknown>
        tin = String(hd.tin || '')
        docNumber = String(hd.docNumber || '')
      }
      if (h.headerText) {
        const ht = h.headerText as Record<string, unknown>
        const lines = ht.headerTextLines as string | undefined
        if (lines) {
          const match = lines.match(/<div[^>]*>([^<]+)<\/div>/)
          const firstGroup = match?.[1]
          if (firstGroup) {
            const raw = decodeHtmlEntities(firstGroup.trim())
            const clean = raw
              .replace(/\s{2,}/g, ' ')
              .replace(/&quot;/g, '')
              .trim()
            const nameOnly = clean.split('"')[0]?.trim() || clean
            storeName = nameOnly
          }
        }
      }
    }
  }

  // Fallback for non-array header
  if (!storeName && !tin) {
    const headerObj = json.header as Record<string, unknown> | undefined
    if (headerObj) {
      storeName = String(headerObj.name || '')
      tin = String(headerObj.tin || '')
    }
  }

  return {
    items,
    source: 'jpk',
    receiptDate,
    rawData: json,
    notes: '',
    total: groszyToZloty(fiscalTotal),
    storeName: storeName || undefined,
    tin: tin || undefined,
    docNumber: docNumber || undefined,
  }
}
