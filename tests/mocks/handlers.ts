import { HttpResponse, http } from 'msw'

const TEST_USER = { id: '1', email: 'test@test.com', full_name: 'Test User' }

const seedClients = [
  { id: 'c1', org_id: 'org-1', name: 'John', surname: 'Doe', phone: '123', notes: '' },
  { id: 'c2', org_id: 'org-1', name: 'Jane', surname: 'Smith', phone: '456', notes: '' },
]

const seedProducts = [
  {
    id: 'p1',
    org_id: 'org-1',
    name: 'Bread',
    category: 'Pastry',
    unit: 'pcs',
    product_type: 'good',
    price: '10.00',
    cost_price: '5.00',
    stock_qty: null,
    track_inventory: false,
    is_sellable: true,
    is_active: true,
  },
  {
    id: 'p2',
    org_id: 'org-1',
    name: 'Croissant',
    category: 'Pastry',
    unit: 'pcs',
    product_type: 'good',
    price: '8.00',
    cost_price: '3.00',
    stock_qty: null,
    track_inventory: false,
    is_sellable: true,
    is_active: true,
  },
]

type SeedOrder = {
  id: string
  org_id: string
  client_id: string | null
  status: string
  total: number
  execution_date: string
  notes: string
  custom_fields?: Record<string, unknown>
  items: Array<{
    id: string
    order_id: string
    product_id: string | null
    name: string
    price: number
    qty: number
  }>
}

const seedOrders: SeedOrder[] = [
  {
    id: 'o1',
    org_id: 'org-1',
    client_id: null,
    status: 'draft',
    total: 100,
    execution_date: '2025-01-15',
    notes: '',
    items: [],
  },
  {
    id: 'o2',
    org_id: 'org-1',
    client_id: 'c1',
    status: 'confirmed',
    total: 200,
    execution_date: '2025-01-20',
    notes: 'Urgent',
    items: [],
  },
]

const clients = [...seedClients]
const products = [...seedProducts]
const orders: SeedOrder[] = [...seedOrders]
let entityCounter = 0

const seedSessions = [
  {
    id: 's1',
    created_at: '2026-08-20T09:30:00Z',
    expires_at: '2026-09-19T09:30:00Z',
    last_used_at: null,
    ip: '192.168.0.10',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0 Safari/537.36',
    is_current: true,
  },
  {
    id: 's2',
    created_at: '2026-08-01T09:30:00Z',
    expires_at: '2026-08-31T09:30:00Z',
    last_used_at: null,
    ip: '10.0.0.8',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
    is_current: false,
  },
]
let sessions = [...seedSessions]

export const handlers = [
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      user: TEST_USER,
    })
  }),

  http.post('/api/v1/auth/register', () => {
    return HttpResponse.json({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      user: TEST_USER,
    })
  }),

  http.post('/api/v1/auth/logout', () => {
    return HttpResponse.json(null, { status: 200 })
  }),

  http.post('/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      token_type: 'bearer',
    })
  }),

  http.post('/api/v1/auth/change-password', () => {
    // Backend revokes all sessions on success; FE logs out and redirects.
    return HttpResponse.json({ status: 'ok' })
  }),

  http.get('/api/v1/auth/sessions', () => {
    return HttpResponse.json(sessions)
  }),

  http.delete('/api/v1/auth/sessions/:sessionId', ({ params }) => {
    sessions = sessions.filter((session) => session.id !== params.sessionId)
    return HttpResponse.json({ status: 'ok' })
  }),

  http.delete('/api/v1/auth/sessions', () => {
    sessions = []
    return HttpResponse.json({ status: 'ok' })
  }),

  http.get('/api/v1/orgs', () => {
    return HttpResponse.json([
      { id: 'org-1', name: 'Test Bakery', owner_id: '1', timezone: 'Europe/Warsaw' },
      { id: 'org-2', name: 'Test Cafe', owner_id: '1', timezone: 'Europe/Warsaw' },
    ])
  }),

  http.post('/api/v1/orgs', async ({ request }) => {
    const body = (await request.json()) as { name: string }
    return HttpResponse.json(
      {
        id: 'org-new',
        name: body.name,
        owner_id: '1',
        timezone: 'UTC',
      },
      { status: 201 },
    )
  }),

  http.get('/api/v1/orgs/:orgId/settings', () => {
    return HttpResponse.json({ currency: 'PLN' })
  }),

  http.put('/api/v1/orgs/:orgId/settings', async ({ request }) => {
    const body = (await request.json()) as { currency: string }
    return HttpResponse.json({ currency: body.currency })
  }),

  http.get('/api/v1/orgs/:orgId/members', () => {
    return HttpResponse.json([
      { user_id: '1', email: 'test@test.com', full_name: 'Test User', role: 'owner' },
    ])
  }),

  http.delete('/api/v1/orgs/:orgId/members/:userId', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/v1/orgs/:orgId/invites', () => {
    return HttpResponse.json([
      {
        invite_id: 'inv-1',
        email: 'invited@test.com',
        token: 'test-invite-token',
        expires_at: '2026-12-31T00:00:00Z',
      },
    ])
  }),

  http.post('/api/v1/orgs/:orgId/invites', async ({ request }) => {
    const body = (await request.json()) as { email: string }
    return HttpResponse.json(
      {
        invite_id: 'inv-new',
        token: 'new-invite-token',
        expires_at: '2026-12-31T00:00:00Z',
        email: body.email,
      },
      { status: 201 },
    )
  }),

  http.delete('/api/v1/orgs/:orgId/invites/:inviteId', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/v1/auth/invites/accept', () => {
    return HttpResponse.json({ org_id: 'org-1', org_name: 'Test Bakery', role: 'member' })
  }),

  http.get('/api/v1/clients', ({ request }) => {
    const url = new URL(request.url)
    const name = url.searchParams.get('filter[name]')
    const filtered = name
      ? clients.filter((client) => client.name.toLowerCase().includes(name.toLowerCase()))
      : clients
    return HttpResponse.json({ data: filtered, next_cursor: null })
  }),

  http.get('/api/v1/clients/all', () => {
    return HttpResponse.json([
      { id: 'c1', org_id: 'org-1', name: 'John', surname: 'Doe', phone: '123', notes: '' },
      { id: 'c2', org_id: 'org-1', name: 'Jane', surname: 'Smith', phone: '456', notes: '' },
    ])
  }),

  http.get('/api/v1/clients/:clientId', ({ params }) => {
    return HttpResponse.json({
      id: params.clientId,
      org_id: 'org-1',
      name: 'John',
      surname: 'Doe',
      phone: '123',
      notes: '',
    })
  }),

  http.post('/api/v1/clients', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      surname?: string
      phone?: string
      notes?: string
    }
    entityCounter += 1
    const client = {
      id: `c-new-${entityCounter}`,
      org_id: 'org-1',
      name: body.name,
      surname: body.surname ?? '',
      phone: body.phone ?? '',
      notes: body.notes ?? '',
    }
    clients.push(client)
    return HttpResponse.json(client, { status: 201 })
  }),

  http.put('/api/v1/clients/:clientId', async ({ request, params }) => {
    const body = (await request.json()) as { name?: string }
    return HttpResponse.json({
      id: params.clientId,
      org_id: 'org-1',
      name: body.name ?? 'John',
      surname: '',
      phone: '',
      notes: '',
    })
  }),

  http.delete('/api/v1/clients/:clientId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  http.get('/api/v1/products', ({ request }) => {
    const url = new URL(request.url)
    const name = url.searchParams.get('filter[name]')
    const filtered = name
      ? products.filter((product) => product.name.toLowerCase().includes(name.toLowerCase()))
      : products
    return HttpResponse.json({ data: filtered, next_cursor: null })
  }),

  http.get('/api/v1/products/all', () => {
    return HttpResponse.json([
      {
        id: 'p1',
        org_id: 'org-1',
        name: 'Bread',
        category: 'Pastry',
        unit: 'pcs',
        product_type: 'good',
        price: '10.00',
        cost_price: '5.00',
        stock_qty: null,
        track_inventory: false,
        is_sellable: true,
        is_active: true,
      },
      {
        id: 'p2',
        org_id: 'org-1',
        name: 'Croissant',
        category: 'Pastry',
        unit: 'pcs',
        product_type: 'good',
        price: '8.00',
        cost_price: '3.00',
        stock_qty: null,
        track_inventory: false,
        is_sellable: true,
        is_active: true,
      },
    ])
  }),

  http.get('/api/v1/products/:productId', ({ params }) => {
    return HttpResponse.json({
      id: params.productId,
      org_id: 'org-1',
      name: 'Bread',
      category: 'Pastry',
      unit: 'pcs',
      product_type: 'good',
      price: '10.00',
      cost_price: '5.00',
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    })
  }),

  http.post('/api/v1/products', async ({ request }) => {
    const body = (await request.json()) as {
      name: string
      category?: string
      unit?: string
      product_type?: string
      price?: number
      cost_price?: number
    }
    entityCounter += 1
    const product = {
      id: `p-new-${entityCounter}`,
      org_id: 'org-1',
      name: body.name,
      category: body.category ?? '',
      unit: body.unit ?? 'pcs',
      product_type: body.product_type ?? 'good',
      price: (body.price ?? 0).toFixed(2),
      cost_price: (body.cost_price ?? 0).toFixed(2),
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    }
    products.push(product)
    return HttpResponse.json(product, { status: 201 })
  }),

  http.put('/api/v1/products/:productId', async ({ request, params }) => {
    const body = (await request.json()) as { name?: string }
    return HttpResponse.json({
      id: params.productId,
      org_id: 'org-1',
      name: body.name ?? 'Bread',
      category: '',
      unit: 'pcs',
      product_type: 'good',
      price: '0.00',
      cost_price: '0.00',
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    })
  }),

  http.delete('/api/v1/products/:productId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  http.get('/api/v1/orders', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('filter[status]')
    const filtered = status ? orders.filter((order) => order.status === status) : orders
    const data = filtered.map(({ items: _items, ...order }) => order)
    return HttpResponse.json({ data, next_cursor: null })
  }),

  http.get('/api/v1/orders/all', () => {
    const data = orders.map(({ items: _items, ...order }) => order)
    return HttpResponse.json(data)
  }),

  http.get('/api/v1/orders/:orderId', ({ params }) => {
    const order = orders.find((o) => o.id === params.orderId)
    if (order) {
      return HttpResponse.json(order)
    }
    return HttpResponse.json({
      id: params.orderId,
      org_id: 'org-1',
      client_id: null,
      status: 'draft',
      total: 100,
      execution_date: '2025-01-15',
      notes: '',
    })
  }),

  http.post('/api/v1/orders', async ({ request }) => {
    const body = (await request.json()) as {
      client_id?: string
      execution_date?: string
      notes?: string
      custom_fields?: Record<string, unknown>
    }
    entityCounter += 1
    const order: SeedOrder = {
      id: `o-new-${entityCounter}`,
      org_id: 'org-1',
      client_id: body.client_id ?? null,
      status: 'draft',
      total: 0,
      execution_date: body.execution_date ?? new Date().toISOString().split('T')[0] ?? '',
      notes: body.notes ?? '',
      custom_fields: body.custom_fields ?? {},
      items: [],
    }
    orders.push(order)
    const { items: _items, ...orderData } = order
    return HttpResponse.json(orderData, { status: 201 })
  }),

  http.post('/api/v1/orders/:orderId/items', async ({ request, params }) => {
    const body = (await request.json()) as {
      product_id?: string
      name: string
      price?: number
      qty?: number
    }
    entityCounter += 1
    const item = {
      id: `item-new-${entityCounter}`,
      order_id: params.orderId as string,
      product_id: body.product_id ?? null,
      name: body.name,
      price: body.price ?? 0,
      qty: body.qty ?? 1,
    }
    const order = orders.find((o) => o.id === params.orderId)
    if (order) {
      order.items.push(item)
      order.total += item.price * item.qty
    }
    return HttpResponse.json(item, { status: 201 })
  }),

  http.delete('/api/v1/orders/:orderId/items/:itemId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  http.post('/api/v1/orders/:orderId/status', async ({ request, params }) => {
    const body = (await request.json()) as { status: string }
    const order = orders.find((o) => o.id === params.orderId)
    if (order) {
      order.status = body.status
      const { items: _items, ...orderData } = order
      return HttpResponse.json(orderData)
    }
    return HttpResponse.json({
      id: params.orderId,
      org_id: 'org-1',
      client_id: null,
      status: body.status,
      total: 100,
      execution_date: '2025-01-15',
      notes: '',
    })
  }),

  http.get('/api/v1/eav/attributes', ({ request }) => {
    const url = new URL(request.url)
    const entityCode = url.searchParams.get('entity_code')
    const attributes =
      entityCode === 'client'
        ? [
            {
              id: 'eav-1',
              org_id: 'org-1',
              entity_code: 'client',
              code: 'instagram',
              name: 'Instagram',
              field_type: 'string',
              is_required: false,
              default_value: '',
            },
            {
              id: 'eav-2',
              org_id: 'org-1',
              entity_code: 'client',
              code: 'birthday',
              name: 'Birthday',
              field_type: 'date',
              is_required: true,
              default_value: '',
            },
          ]
        : entityCode === 'order'
          ? [
              {
                id: 'eav-4',
                org_id: 'org-1',
                entity_code: 'order',
                code: 'delivery_date',
                name: 'Delivery date',
                field_type: 'date',
                is_required: false,
                default_value: '',
              },
            ]
          : [
              {
                id: 'eav-3',
                org_id: 'org-1',
                entity_code: 'product',
                code: 'weight',
                name: 'Weight',
                field_type: 'number',
                is_required: false,
                default_value: '0',
              },
            ]
    return HttpResponse.json(attributes)
  }),

  http.post('/api/v1/eav/attributes', async ({ request }) => {
    const body = (await request.json()) as {
      entity_code: string
      code: string
      name: string
      field_type?: string
      is_required?: boolean
      default_value?: string
    }
    return HttpResponse.json(
      {
        id: 'eav-new',
        org_id: 'org-1',
        entity_code: body.entity_code,
        code: body.code,
        name: body.name,
        field_type: body.field_type ?? 'string',
        is_required: body.is_required ?? false,
        default_value: body.default_value ?? '',
      },
      { status: 201 },
    )
  }),

  http.delete('/api/v1/eav/attributes/:attributeId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  http.post('/api/v1/orders/:orderId/write-offs', async ({ request }) => {
    const body = (await request.json()) as { order_item_id: string; qty: number; reason?: string }
    return HttpResponse.json(
      {
        id: 'wo-new',
        product_id: 'p1',
        qty: body.qty,
        reason: body.reason ?? null,
        created_at: '2025-01-01T00:00:00Z',
      },
      { status: 201 },
    )
  }),

  http.post('/api/v1/media/upload/:entityType/:entityId', async () => {
    return HttpResponse.json({ key: 'uploaded-photo-key' }, { status: 200 })
  }),

  http.get('/api/v1/media/list/:entityType/:entityId', () => {
    return HttpResponse.json([{ key: 'photo-1' }, { key: 'photo-2' }])
  }),

  http.delete('/api/v1/media/:key', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  http.get('/api/v1/receipts', ({ request }) => {
    const url = new URL(request.url)
    const source = url.searchParams.get('filter[source]')
    const receipts = source
      ? [
          {
            id: 'r1',
            org_id: 'org-1',
            client_id: null,
            order_id: null,
            receipt_date: '2025-01-15',
            total: 100,
            source,
            raw_data: null,
            notes: null,
          },
        ]
      : [
          {
            id: 'r1',
            org_id: 'org-1',
            client_id: null,
            order_id: null,
            receipt_date: '2025-01-15',
            total: 100,
            source: 'jpk',
            raw_data: null,
            notes: null,
          },
          {
            id: 'r2',
            org_id: 'org-1',
            client_id: 'c1',
            order_id: null,
            receipt_date: '2025-01-20',
            total: 200,
            source: null,
            raw_data: null,
            notes: 'Test',
          },
        ]
    return HttpResponse.json({ data: receipts, next_cursor: null })
  }),

  http.get('/api/v1/receipts/all', () => {
    return HttpResponse.json([
      {
        id: 'r1',
        org_id: 'org-1',
        client_id: null,
        order_id: null,
        receipt_date: '2025-01-15',
        total: 100,
        source: 'jpk',
        raw_data: null,
        notes: null,
      },
      {
        id: 'r2',
        org_id: 'org-1',
        client_id: 'c1',
        order_id: null,
        receipt_date: '2025-01-20',
        total: 200,
        source: null,
        raw_data: null,
        notes: 'Test',
      },
    ])
  }),

  http.get('/api/v1/receipts/:receiptId', ({ params }) => {
    return HttpResponse.json({
      id: params.receiptId,
      org_id: 'org-1',
      client_id: null,
      order_id: null,
      receipt_date: '2025-01-15',
      total: 100,
      source: 'jpk',
      raw_data: { store: 'Test Store' },
      notes: 'Test notes',
    })
  }),

  http.post('/api/v1/receipts', async ({ request }) => {
    const body = (await request.json()) as {
      receipt_date?: string
      source?: string
      notes?: string
    }
    return HttpResponse.json(
      {
        id: 'r-new',
        org_id: 'org-1',
        client_id: null,
        order_id: null,
        receipt_date: body.receipt_date ?? '2025-01-15',
        total: 0,
        source: body.source ?? null,
        raw_data: null,
        notes: body.notes ?? null,
      },
      { status: 201 },
    )
  }),

  http.delete('/api/v1/receipts/:receiptId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  http.get('/api/v1/receipts/:receiptId/items', () => {
    return HttpResponse.json([
      { id: 'i1', receipt_id: 'r1', product_id: null, name: 'Bread', price: 10, qty: 5 },
      { id: 'i2', receipt_id: 'r1', product_id: 'p1', name: 'Croissant', price: 8, qty: 3 },
    ])
  }),

  http.get('/api/v1/finances/summary', () => {
    return HttpResponse.json({
      total_revenue: 50000,
      total_expenses: 30000,
      total_pnl: 20000,
      monthly: [
        { month: '2025-01', revenue: 10000, expenses: 5000, pnl: 5000 },
        { month: '2025-02', revenue: 12000, expenses: 6000, pnl: 6000 },
        { month: '2025-03', revenue: 15000, expenses: 8000, pnl: 7000 },
        { month: '2025-04', revenue: 13000, expenses: 11000, pnl: 2000 },
      ],
      from_month: '2025-01',
      to_month: '2025-04',
    })
  }),

  http.post('/api/v1/consent/cookie', () => {
    return HttpResponse.json(null, { status: 200 })
  }),

  http.post('/api/v1/consent/policy', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
]
