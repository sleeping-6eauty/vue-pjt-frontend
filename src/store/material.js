const MATERIAL_STORAGE_KEY = 'material-state-v1'
const MATERIAL_HISTORY_STORAGE_KEY = 'material-history-v1'

const DEFAULT_MATERIALS = [
  {
    id: 1,
    materialId: 'G80-ENGINE-001',
    name: '가솔린 3.5 터보',
    currentStock: 120,
    safetyStock: 90,
    demandQty: 1000,
    unitPrice: 85000
  },
  {
    id: 2,
    materialId: 'MAT-002',
    name: '너트 B',
    currentStock: 40,
    safetyStock: 55,
    demandQty: 1000,
    unitPrice: 12000
  },
  {
    id: 3,
    materialId: 'MAT-003',
    name: '패널 C',
    currentStock: 15,
    safetyStock: 18,
    demandQty: 1000,
    unitPrice: 4300
  }
]

const DEFAULT_HISTORY = [
  { id: 1, date: '2026-04-10', time: '09:15', materialId: 'MAT-002', materialName: '너트 B', type: 'out', typeLabel: '사용', delta: -18, afterStock: 40, reason: '생산지시 #PO-240410-01' },
  { id: 2, date: '2026-04-09', time: '16:40', materialId: 'G80-ENGINE-001', materialName: '가솔린 3.5 터보', type: 'in', typeLabel: '입고', delta: 25, afterStock: 120, reason: '정기 발주 입고' },
  { id: 3, date: '2026-04-09', time: '11:20', materialId: 'MAT-003', materialName: '패널 C', type: 'adjust', typeLabel: '조정', delta: -3, afterStock: 15, reason: '실사 차이 반영' }
]

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  const saved = window.localStorage.getItem(key)
  if (!saved) return fallback

  try {
    return JSON.parse(saved)
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function normalizeMaterial(row) {
  const demandQty = Number(row.demandQty ?? row.pendingOrderQty ?? row.orderedStock ?? 0)
  const currentStock = Number(row.currentStock ?? 0)
  const safetyStock = Number(row.safetyStock ?? 0)
  const unitPrice = Number(row.unitPrice ?? 0)

  return {
    ...row,
    currentStock: Number.isFinite(currentStock) ? currentStock : 0,
    safetyStock: Number.isFinite(safetyStock) ? safetyStock : 0,
    demandQty: Number.isFinite(demandQty) ? demandQty : 0,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0
  }
}

function buildHistoryEntry(target, type, typeLabel, delta, afterStock, reason) {
  const now = new Date()
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    materialId: target.materialId,
    materialName: target.name,
    type,
    typeLabel,
    delta,
    afterStock,
    reason
  }
}

function persistHistory(entry) {
  const historyRows = loadMaterialHistory()
  writeStorage(MATERIAL_HISTORY_STORAGE_KEY, [entry, ...historyRows])
}

export function enrichMaterial(row) {
  const normalized = normalizeMaterial(row)
  const requiredStock = Math.max(0, normalized.safetyStock + normalized.demandQty - normalized.currentStock)
  let status = 'ok'

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

export function loadMaterials() {
  return readStorage(MATERIAL_STORAGE_KEY, DEFAULT_MATERIALS).map(enrichMaterial)
}

export function loadMaterialHistory() {
  return readStorage(MATERIAL_HISTORY_STORAGE_KEY, DEFAULT_HISTORY)
}

export function requestMaterialOrder(materialId) {
  const baseMaterials = readStorage(MATERIAL_STORAGE_KEY, DEFAULT_MATERIALS).map(normalizeMaterial)
  const target = baseMaterials.find((row) => row.materialId === materialId)

  if (!target) return null

  const enriched = enrichMaterial(target)
  if (enriched.requiredStock <= 0) return enriched

  const fulfilledQty = enriched.requiredStock
  const updatedMaterials = baseMaterials.map((row) => {
    if (row.materialId !== materialId) return row

    return {
      ...row,
      currentStock: row.currentStock + fulfilledQty
    }
  })

  writeStorage(MATERIAL_STORAGE_KEY, updatedMaterials)
  persistHistory(
    buildHistoryEntry(target, 'in', '입고', fulfilledQty, target.currentStock + fulfilledQty, '주문요청 처리')
  )

  return enrichMaterial(updatedMaterials.find((row) => row.materialId === materialId))
}

export function useMaterialStock(materialId) {
  const baseMaterials = readStorage(MATERIAL_STORAGE_KEY, DEFAULT_MATERIALS).map(normalizeMaterial)
  const target = baseMaterials.find((row) => row.materialId === materialId)
  if (!target) return null

  const usedQty = Math.min(target.currentStock, target.demandQty)
  if (usedQty <= 0) return enrichMaterial(target)

  const updatedMaterials = baseMaterials.map((row) => {
    if (row.materialId !== materialId) return row
    return {
      ...row,
      currentStock: row.currentStock - usedQty,
      demandQty: row.demandQty - usedQty
    }
  })

  writeStorage(MATERIAL_STORAGE_KEY, updatedMaterials)
  persistHistory(
    buildHistoryEntry(target, 'out', '사용', -usedQty, target.currentStock - usedQty, '자재 사용 처리')
  )

  return enrichMaterial(updatedMaterials.find((row) => row.materialId === materialId))
}

export function adjustMaterialStock(materialId, nextStock) {
  const amount = Number(nextStock)
  if (!Number.isFinite(amount) || amount < 0) return null

  const adjustedStock = Math.floor(amount)
  const baseMaterials = readStorage(MATERIAL_STORAGE_KEY, DEFAULT_MATERIALS).map(normalizeMaterial)
  const target = baseMaterials.find((row) => row.materialId === materialId)
  if (!target) return null

  const delta = adjustedStock - target.currentStock
  const updatedMaterials = baseMaterials.map((row) => {
    if (row.materialId !== materialId) return row
    return {
      ...row,
      currentStock: adjustedStock
    }
  })

  writeStorage(MATERIAL_STORAGE_KEY, updatedMaterials)
  persistHistory(
    buildHistoryEntry(target, 'adjust', '조정', delta, adjustedStock, '실사 차이 반영')
  )

  return enrichMaterial(updatedMaterials.find((row) => row.materialId === materialId))
}
