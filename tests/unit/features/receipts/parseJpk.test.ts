import { parseJpkFile } from '@/features/receipts/lib/parseJpk'

describe('parseJpkFile', () => {
  it('parses basic sellLine items using total/qty', () => {
    const result = parseJpkFile({
      body: [
        { sellLine: { name: 'Bread', price: 1000, total: 2000, quantity: 2 } },
        { sellLine: { name: 'Croissant', price: 800, total: 800, quantity: 1 } },
      ],
    })
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({ name: 'Bread', price: 10, qty: 2 })
    expect(result.items[1]).toEqual({ name: 'Croissant', price: 8, qty: 1 })
  })

  it('subtracts discountLine.value from sellLine.total and includes discount', () => {
    const result = parseJpkFile({
      body: [
        { sellLine: { name: 'Bread', price: 1000, total: 2000, quantity: 2 } },
        { discountLine: { value: 500, isDiscount: true } },
        { sellLine: { name: 'Milk', price: 500, total: 1000, quantity: 2 } },
      ],
    })
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({
      name: 'Bread',
      price: 7.5,
      qty: 2,
      discount: 5,
      original_total: 20,
    })
    expect(result.items[1]).toEqual({ name: 'Milk', price: 5, qty: 2 })
  })

  it('ignores non-discount entries after sellLine', () => {
    const result = parseJpkFile({
      body: [
        { sellLine: { name: 'Bread', price: 1000, total: 2000, quantity: 2 } },
        { discountLine: { value: 400, isDiscount: true } },
      ],
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toEqual({
      name: 'Bread',
      price: 8,
      qty: 2,
      discount: 4,
      original_total: 20,
    })
  })

  it('parses real JPK structure correctly', () => {
    const result = parseJpkFile({
      body: [
        {
          sellLine: {
            name: 'ParówkiDrobiowe700g',
            price: 999,
            total: 1998,
            quantity: '2',
            vatId: 'C',
          },
        },
        { discountLine: { base: 1998, value: 701, isDiscount: true, isPercent: false } },
        {
          sellLine: {
            name: 'Mleko UHT 3,2 1l',
            price: 329,
            total: 1974,
            quantity: '6',
            vatId: 'C',
          },
        },
        { discountLine: { base: 1974, value: 1080, isDiscount: true, isPercent: false } },
        {
          vatSummary: {
            vatRatesSummary: [{ vatId: 'C', vatRate: 500, vatSale: 3972, vatAmount: 189 }],
          },
        },
        { sumInCurrency: { fiscalTotal: 2191 } },
      ],
    })
    expect(result.items).toHaveLength(2)
    const it0 = result.items[0] as NonNullable<(typeof result.items)[0]>
    const it1 = result.items[1] as NonNullable<(typeof result.items)[0]>
    expect(it0.name).toBe('ParówkiDrobiowe700g')
    expect(it0.price).toBeCloseTo(6.485, 3)
    expect(it0.qty).toBe(2)
    expect(it0.discount).toBeCloseTo(7.01, 2)
    expect(it0.original_total).toBeCloseTo(19.98, 2)
    expect(it0.vat_rate).toBe('C')
    expect(it0.vat_percent).toBe(5)
    expect(it1.name).toBe('Mleko UHT 3,2 1l')
    expect(it1.price).toBeCloseTo(1.49, 2)
    expect(it1.qty).toBe(6)
    expect(it1.discount).toBeCloseTo(10.8, 2)
    expect(it1.original_total).toBeCloseTo(19.74, 2)
    expect(it1.vat_rate).toBe('C')
    expect(it1.vat_percent).toBe(5)
    expect(result.total).toBeCloseTo(21.91, 2)
  })

  it('parses VAT rate from vatId', () => {
    const result = parseJpkFile({
      body: [
        { sellLine: { name: 'Cola', price: 500, total: 1000, quantity: 2, vatId: 'A' } },
        { sellLine: { name: 'Milk', price: 300, total: 600, quantity: 2, vatId: 'C' } },
      ],
    })
    expect(result.items[0]?.vat_rate).toBe('A')
    expect(result.items[0]?.vat_percent).toBe(23)
    expect(result.items[1]?.vat_rate).toBe('C')
    expect(result.items[1]?.vat_percent).toBe(5)
  })

  it('parses quantity with comma separator', () => {
    const result = parseJpkFile({
      body: [{ sellLine: { name: 'Cheese', price: 1500, total: 750, quantity: '0,5' } }],
    })
    expect(result.items[0]).toEqual({ name: 'Cheese', price: 15, qty: 0.5 })
  })

  it('extracts receipt date from JSON', () => {
    const result = parseJpkFile({
      receiptDate: '2025-03-15',
      body: [],
    })
    expect(result.receiptDate).toBe('2025-03-15')
  })

  it('extracts store name and NIP from header', () => {
    const result = parseJpkFile({
      header: { name: 'BIEDRONKA', tin: '7791011327' },
      body: [],
    })
    expect(result.storeName).toBe('BIEDRONKA')
    expect(result.tin).toBe('7791011327')
  })

  it('decodes HTML entities in header store name', () => {
    const result = parseJpkFile({
      header: [
        {
          headerText: {
            headerTextLines:
              '<center><div>BIEDRONKA&nbsp;&quot;CODZIENNIE&nbsp;NISKIE&nbsp;CENY&quot;&nbsp;5860</div></center>',
          },
        },
        { headerData: { tin: '7791011327' } },
      ],
      body: [],
    })
    expect(result.storeName).toBe('BIEDRONKA')
    expect(result.tin).toBe('7791011327')
  })

  it('sets source to jpk', () => {
    const result = parseJpkFile({ body: [] })
    expect(result.source).toBe('jpk')
  })

  it('stores raw data', () => {
    const input = { body: [{ sellLine: { name: 'Test', price: 100, total: 100, quantity: 1 } }] }
    const result = parseJpkFile(input)
    expect(result.rawData).toEqual(input)
  })

  it('parses JWT data field and extracts VAT', () => {
    const payload = JSON.stringify({
      dokument: {
        naglowek: { dataJPK: '2026-06-01T12:00:00.000Z' },
        podmiot1: { NIP: '1234567890', nazwaPod: 'SKLEP TEST' },
        paragon: {
          pozycja: [
            {
              towar: {
                brutto: 1297,
                cena: 999,
                idStPTU: 'C',
                ilosc: '2',
                nazwa: 'SałatkaŚledzowa      C',
                rabat: { opis: '1', wart: -701 },
              },
            },
          ],
          stPTU: [{ id: 'C', wart: 500 }],
          podsum: { sumaBrutto: 1297 },
        },
      },
    })
    const utf8Bytes = new TextEncoder().encode(payload)
    const data = `header.${btoa(String.fromCharCode(...new Uint8Array(utf8Bytes)))}.signature`
    const result = parseJpkFile({ data } as unknown as Record<string, unknown>)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.name).toBe('SałatkaŚledzowa')
    expect(result.items[0]?.price).toBeCloseTo(6.485, 3)
    expect(result.items[0]?.qty).toBe(2)
    expect(result.items[0]?.discount).toBeCloseTo(7.01, 2)
    expect(result.items[0]?.original_total).toBeCloseTo(19.98, 2)
    expect(result.items[0]?.vat_rate).toBe('C')
    expect(result.items[0]?.vat_percent).toBe(5)
    expect(result.total).toBeCloseTo(12.97, 2)
    expect(result.receiptDate).toBe('2026-06-01')
    expect(result.storeName).toBe('SKLEP TEST')
    expect(result.tin).toBe('1234567890')
    expect(result.notes).toBe('')
  })

  it('preserves Polish characters in JWT payload', () => {
    const payload = JSON.stringify({
      dokument: {
        naglowek: {},
        podmiot1: {},
        paragon: {
          pozycja: [
            {
              towar: {
                brutto: 1000,
                cena: 1000,
                idStPTU: 'A',
                ilosc: '1',
                nazwa: 'ŻółćGęśŁódźĄĘĆŃ      A',
              },
            },
          ],
          podsum: { sumaBrutto: 1000 },
        },
      },
    })
    // Encode payload as UTF-8, then base64 (btoa only handles Latin-1)
    const utf8Bytes = new TextEncoder().encode(payload)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(utf8Bytes)))
    const data = `h.${base64}.s`
    const result = parseJpkFile({ data } as unknown as Record<string, unknown>)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.name).toBe('ŻółćGęśŁódźĄĘĆŃ')
  })

  it('strips trailing VAT suffix from body item names', () => {
    const result = parseJpkFile({
      body: [
        {
          sellLine: {
            name: 'ParówkiDrobiowe700g      C',
            price: 999,
            total: 999,
            quantity: 1,
            vatId: 'C',
          },
        },
        {
          sellLine: {
            name: 'Mleko UHT 3,2 1l        C',
            price: 329,
            total: 329,
            quantity: 1,
            vatId: 'C',
          },
        },
      ],
    })
    expect(result.items[0]?.name).toBe('ParówkiDrobiowe700g')
    expect(result.items[1]?.name).toBe('Mleko UHT 3,2 1l')
    expect(result.items[0]?.vat_rate).toBe('C')
    expect(result.items[1]?.vat_rate).toBe('C')
  })
})
