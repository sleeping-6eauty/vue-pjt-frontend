const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const HISTORY_LABEL = {
  in: 'Inbound',
  out: 'Usage',
  adjust: 'Adjust'
}

function normalizeMaterial(row) {
  const demandQty = Number(row?.demandQty ?? row?.pendingOrderQty ?? row?.orderedStock ?? 0)
  const currentStock = Number(row?.currentStock ?? 0)
  const safetyStock = Number(row?.safetyStock ?? 0)
  const unitPrice = Number(row?.unitPrice ?? 0)

  return {
    ...row,
    currentStock: Number.isFinite(currentStock) ? currentStock : 0,
    safetyStock: Number.isFinite(safetyStock) ? safetyStock : 0,
    demandQty: Number.isFinite(demandQty) ? demandQty : 0,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0
  }
}

function normalizeHistory(row, index) {
  const type = row?.type ?? 'adjust'
  return {
    id: row?.id ?? Date.now() + index,
    date: row?.date ?? '',
    time: row?.time ?? '',
    materialId: row?.materialId ?? '',
    materialName: row?.materialName ?? row?.name ?? '',
    type,
    typeLabel: row?.typeLabel ?? HISTORY_LABEL[type] ?? type,
    delta: Number(row?.delta ?? 0),
    afterStock: Number(row?.afterStock ?? 0),
    reason: row?.reason ?? ''
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.message || `API request failed (${response.status})`
    throw new Error(message)
  }

  return payload
}

export function enrichMaterial(row) {
  const normalized = normalizeMaterial(row)
  const requiredStock = Math.max(0, normalized.safetyStock + normalized.demandQty - normalized.currentStock)
  let status = 'normal'

  if (normalized.currentStock < normalized.safetyStock) {
    status = 'danger'
  } else if (requiredStock > 0) {
    status = 'shortage'
  }

  return {
    ...normalized,
    requiredStock,
    status,
    additionalPurchaseCost: requiredStock * normalized.unitPrice
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

export async function useMaterialStock(materialId) {
  const payload = await requestJson(`/api/materials/${encodeURIComponent(materialId)}/use`, {
    method: 'POST'
  })
  return payload ? enrichMaterial(payload) : null
}

export async function adjustMaterialStock(materialId, nextStock) {
  const amount = Number(nextStock)
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('nextStock must be a non-negative number.')
  }

  const payload = await requestJson(`/api/materials/${encodeURIComponent(materialId)}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ nextStock: Math.floor(amount) })
  })

  return payload ? enrichMaterial(payload) : null
}
