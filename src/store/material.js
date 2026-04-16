const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const HISTORY_LABEL = {
  in: '입고',
  out: '출고',
  adjust: '조정'
}

const HISTORY_TYPE_ALIAS = {
  in: 'in',
  inbound: 'in',
  incoming: 'in',
  '입고': 'in',
  out: 'out',
  usage: 'out',
  outbound: 'out',
  outgoing: 'out',
  '출고': 'out',
  adjust: 'adjust',
  adjustment: 'adjust',
  adjusted: 'adjust',
  manual: 'adjust',
  '조정': 'adjust'
}

function normalizeMaterial(row) {
  const demandQty = Number(
    row?.demandQty ??
      row?.requiredStock ??
      row?.pendingOrderQty ??
      row?.orderedStock ??
      0
  )
  const currentStock = Number(row?.currentStock ?? 0)
  const unitPrice = Number(row?.unitPrice ?? 0)

  return {
    ...row,
    currentStock: Number.isFinite(currentStock) ? currentStock : 0,
    demandQty: Number.isFinite(demandQty) ? demandQty : 0,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0
  }
}

function normalizeHistory(row, index) {
  const type = resolveHistoryType(row)
  return {
    id: row?.id ?? Date.now() + index,
    date: row?.date ?? '',
    time: row?.time ?? '',
    materialId: row?.materialId ?? '',
    materialName: row?.materialName ?? row?.name ?? '',
    type,
    typeLabel: HISTORY_LABEL[type] ?? '조정',
    delta: Number(row?.delta ?? 0),
    afterStock: Number(row?.afterStock ?? 0),
    reason: row?.reason ?? ''
  }
}

function resolveHistoryType(row) {
  const candidates = [row?.operationType, row?.type, row?.typeLabel]

  for (const value of candidates) {
    const key = String(value ?? '').trim().toLowerCase()
    if (key && HISTORY_TYPE_ALIAS[key]) {
      return HISTORY_TYPE_ALIAS[key]
    }
  }

  const reason = String(row?.reason ?? '').trim().toLowerCase()
  if (reason.includes('adjust') || reason.includes('조정')) return 'adjust'
  if (reason.includes('inbound') || reason.includes('입고')) return 'in'
  if (reason.includes('usage') || reason.includes('outbound') || reason.includes('출고')) return 'out'

  return 'adjust'
}

async function requestJson(path, options = {}) {
  const requestOptions = options && typeof options === 'object' ? options : {}
  const { headers: optionHeaders, ...restOptions } = requestOptions
  const extraHeaders =
    optionHeaders && typeof optionHeaders === 'object' ? optionHeaders : {}

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    // Ignore non-JSON response bodies.
  }

  if (!response.ok) {
    const message = payload?.message || `API request failed (${response.status})`
    throw new Error(message)
  }

  return payload
}

export function enrichMaterial(row) {
  const normalized = normalizeMaterial(row)
  const requiredStock = Math.max(0, normalized.demandQty)
  const purchaseNeedQty = Math.max(0, requiredStock - normalized.currentStock)
  const status = purchaseNeedQty > 0 ? 'shortage' : 'normal'

  return {
    ...normalized,
    requiredStock,
    purchaseNeedQty,
    status,
    additionalPurchaseCost: purchaseNeedQty * normalized.unitPrice
  }
}

export async function loadMaterials() {
  const payload = await requestJson('/api/materials')
  if (!Array.isArray(payload)) {
    throw new Error('Invalid materials response format.')
  }
  return payload.map(enrichMaterial)
}

export async function loadMaterialHistory() {
  const payload = await requestJson('/api/materials/history')
  if (!Array.isArray(payload)) {
    throw new Error('Invalid material history response format.')
  }
  return payload.map(normalizeHistory)
}

export async function requestMaterialOrder(materialId) {
  const payload = await requestJson(`/api/materials/${encodeURIComponent(materialId)}/order`, {
    method: 'POST'
  })
  return payload ? enrichMaterial(payload) : null
}

function normalizeOperationType(operationType) {
  const key = String(operationType ?? '').trim().toLowerCase()
  if (['in', 'inbound', 'incoming'].includes(key)) return 'INBOUND'
  if (['out', 'outbound', 'outgoing', 'usage'].includes(key)) return 'OUTBOUND'
  if (['adjust', 'adjustment', 'manual'].includes(key)) return 'ADJUSTMENT'
  throw new Error('operationType must be INBOUND, OUTBOUND, or ADJUSTMENT.')
}

export async function adjustMaterialStock(materialId, nextStock, operationType) {
  const amount = Number(nextStock)
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('nextStock must be a non-negative number.')
  }
  const normalizedOperationType = normalizeOperationType(operationType)

  const payload = await requestJson(`/api/materials/${encodeURIComponent(materialId)}/stock`, {
    method: 'PUT',
    body: JSON.stringify({
      nextStock: Math.floor(amount),
      operationType: normalizedOperationType
    })
  })

  return payload ? enrichMaterial(payload) : null
}
