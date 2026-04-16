<template>
  <div class="material-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">자재 관리</h1>
      </div>
    </header>

    <MaterialTabs />

    <section class="stats-row" aria-label="자재 요약">
      <article class="stat-card">
        <p class="stat-label">전체 자재</p>
        <p class="stat-value">{{ summary.total }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">주문 필요 항목</p>
        <p class="stat-value stat-warning">{{ summary.shortage }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">정상 자재</p>
        <p class="stat-value stat-normal">{{ summary.normal }}</p>
      </article>
    </section>

    <div v-if="summary.shortage > 0" class="shortage-banner">
      일부 자재가 부족합니다. 즉시 발주 또는 생산 계획 조정이 필요합니다.
    </div>
    <div v-else class="normal-banner">
      모든 자재가 적정 재고를 유지하고 있습니다.
    </div>

    <div class="filter-bar">
      <div class="filter-input-wrap">
        <span class="input-icon" aria-hidden="true" >⌕</span>
        <input
          v-model.trim="filters.name"
          type="search"
          class="filter-input"
          placeholder="자재명 검색"
        />
      </div>
      <div class="filter-input-wrap">
        <span class="input-icon" aria-hidden="true" >⌕</span>
        <input
          v-model.trim="filters.id"
          type="search"
          class="filter-input"
          placeholder="자재 ID 검색"
        />
      </div>
      <label class="status-field">
        <span class="status-label">상태</span>
        <select v-model="filters.status" class="filter-select">
          <option value="all">전체</option>
          <option value="shortage">부족</option>
          <option value="normal">정상</option>
        </select>
      </label>
    </div>

    <div class="table-card">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-check">
                <input
                  type="checkbox"
                  :checked="allVisibleSelected"
                  @change="toggleSelectAll($event.target.checked)"
                />
              </th>
              <th>자재 ID</th>
              <th>자재명</th>
              <th>
                <button type="button" class="th-sort" @click="toggleSort('currentStock')">
                  보유 재고량
                  <span class="sort-icons" :class="{ active: sortKey === 'currentStock' }">{{ sortGlyph('currentStock') }}</span>
                </button>
              </th>
              <th>
                <button type="button" class="th-sort" @click="toggleSort('requiredStock')">
                  필요 자재량
                  <span class="sort-icons" :class="{ active: sortKey === 'requiredStock' }">{{ sortGlyph('requiredStock') }}</span>
                </button>
              </th>
              <th>상태</th>
              <th>
                <button type="button" class="th-sort" @click="toggleSort('additionalPurchaseCost')">
                  추가 구매 비용
                  <span class="sort-icons" :class="{ active: sortKey === 'additionalPurchaseCost' }">{{ sortGlyph('additionalPurchaseCost') }}</span>
                </button>
              </th>
              <th>재고 처리</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedRows"
              :key="row.id"
              :class="{
                'row-shortage': row.status === 'shortage'
              }"
            >
              <td class="col-check">
                <input v-model="selectedIds" type="checkbox" :value="row.id" />
              </td>
              <td>{{ row.materialId }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.currentStock }}</td>
              <td>{{ row.requiredStock ?? 0 }}</td>
              <td>
                <span class="badge" :class="statusClass(row.status)">
                  {{ statusLabel(row.status) }}
                </span>
              </td>
              <td>{{ formatCurrency(row.additionalPurchaseCost ?? 0) }}</td>
              <td>
                <div class="action-group">
                  <button
                    type="button"
                    class="btn btn-outline btn-order"
                    @click="inboundStock(row.materialId)"
                  >
                    입고
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-order"
                    @click="outboundStock(row.materialId)"
                  >
                    출고
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-order"
                    @click="adjustStock(row.materialId)"
                  >
                    조정
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!pagedRows.length">
              <td colspan="8" class="empty-cell">조건에 맞는 자재가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav class="pagination" aria-label="페이지">
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage <= 1"
          aria-label="이전 페이지"
          @click="currentPage -= 1"
        >
          &lt;
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="page-btn page-num"
          :class="{ 'is-active': currentPage === page }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="page-btn"
          :disabled="currentPage >= totalPages"
          aria-label="다음 페이지"
          @click="currentPage += 1"
        >
          &gt;
        </button>
      </nav>
    </div>
  </div>
</template>

<script>
import MaterialTabs from '@/components/material/MaterialTabs.vue'
import {
  adjustMaterialStock,
  loadMaterials
} from '../../store/material'

export default {
  name: 'Material',
  components: {
    MaterialTabs
  },
  data() {
    return {
      materials: [],
      filters: {
        name: '',
        id: '',
        status: 'all'
      },
      sortKey: 'materialId',
      sortDir: 'asc',
      pageSize: 5,
      currentPage: 1,
      selectedIds: []
    }
  },
  computed: {
    summary() {
      const rows = this.materials
      const shortage = rows.filter((r) => r.status === 'shortage').length
      return {
        total: rows.length,
        shortage,
        normal: rows.filter((r) => r.status === 'normal').length
      }
    },
    filteredRows() {
      let list = this.materials.slice()
      const { name, id, status } = this.filters
      if (name) {
        const q = name.toLowerCase()
        list = list.filter((r) => r.name.toLowerCase().includes(q))
      }
      if (id) {
        const q = id.toLowerCase()
        list = list.filter((r) => r.materialId.toLowerCase().includes(q))
      }
      if (status === 'shortage') list = list.filter((r) => r.status === 'shortage')
      if (status === 'normal') list = list.filter((r) => r.status === 'normal')

      const key = this.sortKey
      const dir = this.sortDir === 'asc' ? 1 : -1
      const cmp = (a, b) => {
        if (key === 'materialId') {
          return a.materialId.localeCompare(b.materialId, 'ko') * dir
        }
        return (a[key] - b[key]) * dir
      }
      list.sort(cmp)
      return list
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize))
    },
    visiblePages() {
      const pages = []
      let start = Math.max(1, this.currentPage - 2)
      let end = Math.min(this.totalPages, start + 4)
      start = Math.max(1, end - 4)
      for (let page = start; page <= end; page += 1) {
        pages.push(page)
      }
      return pages
    },
    pagedRows() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredRows.slice(start, start + this.pageSize)
    },
    allVisibleSelected() {
      if (!this.pagedRows.length) return false
      return this.pagedRows.every((r) => this.selectedIds.includes(r.id))
    }
  },
  watch: {
    filters: {
      deep: true,
      handler() {
        this.currentPage = 1
      }
    },
    filteredRows() {
      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages
    }
  },
  async mounted() {
    await this.refreshMaterials()
  },
  methods: {
    async refreshMaterials() {
      try {
        this.materials = await loadMaterials()
        this.selectedIds = this.selectedIds.filter((id) => this.materials.some((row) => row.id === id))
      } catch (error) {
        console.error('Failed to load materials from server:', error)
        this.materials = []
        this.selectedIds = []
        window.alert(error.message || '서버에서 자재 데이터를 불러오지 못했습니다.')
      }
    },
    toggleSort(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortKey = key
        this.sortDir = 'asc'
      }
    },
    sortGlyph(key) {
      if (this.sortKey !== key) return '↕'
      return this.sortDir === 'asc' ? '↑' : '↓'
    },
    toggleSelectAll(checked) {
      const ids = this.pagedRows.map((r) => r.id)
      if (checked) {
        const set = new Set([...this.selectedIds, ...ids])
        this.selectedIds = [...set]
      } else {
        const idSet = new Set(ids)
        this.selectedIds = this.selectedIds.filter((id) => !idSet.has(id))
      }
    },
    statusLabel(status) {
      if (status === 'shortage') return '부족'
      return '정상'
    },
    statusClass(status) {
      if (status === 'shortage') return 'badge-warning'
      return 'badge-normal'
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
      }).format(value)
    },
    parsePositiveQuantity(raw, label) {
      const amount = Number(raw)
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`${label}은(는) 0보다 큰 숫자여야 합니다.`)
      }
      return Math.floor(amount)
    },
    async inboundStock(materialId) {
      const row = this.materials.find((item) => item.materialId === materialId)
      if (!row) return

      const raw = window.prompt('입고량을 입력하세요.', '0')
      if (raw === null) return

      try {
        const quantity = this.parsePositiveQuantity(raw, '입고량')
        await adjustMaterialStock(materialId, row.currentStock + quantity, 'INBOUND')
        await this.refreshMaterials()
      } catch (error) {
        console.error('Failed to process inbound stock:', error)
        window.alert(error.message || '입고 처리에 실패했습니다.')
      }
    },
    async outboundStock(materialId) {
      const row = this.materials.find((item) => item.materialId === materialId)
      if (!row) return

      const raw = window.prompt('출고량을 입력하세요.', '0')
      if (raw === null) return

      try {
        const quantity = this.parsePositiveQuantity(raw, '출고량')
        if (quantity > row.currentStock) {
          throw new Error('출고량은 현재 보유 재고량을 초과할 수 없습니다.')
        }

        await adjustMaterialStock(materialId, row.currentStock - quantity, 'OUTBOUND')
        await this.refreshMaterials()
      } catch (error) {
        console.error('Failed to process outbound stock:', error)
        window.alert(error.message || '출고 처리에 실패했습니다.')
      }
    },
    async adjustStock(materialId) {
      const row = this.materials.find((item) => item.materialId === materialId)
      const raw = window.prompt('조정 후 보유 재고값을 입력하세요.', String(row?.currentStock ?? 0))
      if (raw === null) return

      try {
        await adjustMaterialStock(materialId, raw, 'ADJUSTMENT')
        await this.refreshMaterials()
      } catch (error) {
        console.error('Failed to adjust material stock:', error)
        window.alert(error.message || '재고 조정에 실패했습니다.')
      }
    }
  }
}
</script>

<style scoped>
.material-page {
  width: 100%;
  max-width: none;
  min-height: 100%;
  margin: 0;
  padding: 0 0 24px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 25px;
  font-weight: 700;
  color: #111;
}

.page-description {
  margin: 0;
  color: #666;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
}

.btn-outline {
  background: #fff;
  color: #333;
  border-color: #dee2e6;
}

.btn-outline:hover {
  background: #f1f3f5;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
  font-weight: bold;
}

.btn-icon.doc {
  width: 14px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 2px;
  position: relative;
}

.btn-icon.doc::after {
  content: '';
  position: absolute;
  left: 2px;
  right: 2px;
  top: 4px;
  height: 2px;
  background: currentColor;
  box-shadow: 0 3px 0 currentColor;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid #eef0f2;
}

.stat-label {
  margin: 0 0 8px;
  font-size: 16px;
  color: #666;
  font-weight: bold;
}

.stat-value {
  margin: 0;
  font-size: 40px;
  font-weight: bold;
  color: #111;
}

/* .stat-value .unit {
  font-size: 25px;
  font-weight: bold;
  margin-left: 2px;
} */

.stat-shortage {
  color: #f19985;
}

.stat-warning {
  color: #E63312;
}

.stat-normal {
  color: #00aad2;
}

.shortage-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #f6b8aa;
  background: #fdebe7;
  color: #c2412d;
  font-weight: bold;
}

.normal-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #a6dbe8;
  background: #e6f6fb;
  color: #007fa3;
  font-weight: bold;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 16px;
  padding: 20px 16px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef0f2;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.filter-input-wrap {
  position: relative;
  flex: 1 1 180px;
  min-width: 160px;
  input:focus {
    /* border: 2px solid #999; */
    outline: none;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.18);
  }
  input {
    height: 45px;
    box-sizing: border-box;
  }
}

.filter-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px 10px 36px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F1F3F5;
}

.input-icon {
  position: absolute;
  color: #8a8a8a;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 30px;
  border-radius: 50%;
  pointer-events: none;
}

.status-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}

.status-label {
  font-size: 15px;
  font-weight: bold;
  color: #555;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  font-family: inherit;
}

.btn-order {
  min-width: 92px;
  justify-content: center;
  padding: 8px 14px;
}

.btn-order:disabled {
  background: #dee2e6;
  border-color: #dee2e6;
  color: #6c757d;
  cursor: default;
}

.table-card {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f2;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 920px;
}

.data-table th,
.data-table td {
  padding: 14px 12px;
  text-align: center;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.data-table th {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.col-check {
  width: 48px;
}

.th-sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-weight: bold;
  color: inherit;
  cursor: pointer;
}

.th-sort:hover {
  color: #002c5f;
}

.sort-icons {
  font-size: 12px;
  color: #adb5bd;
  min-width: 14px;
  text-align: center;
}

.sort-icons.active {
  color: #002c5f;
}

.row-shortage {
  background-color: #fbd6cf;
}

.badge {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  font-size: 15px;
  font-weight: bold;
  min-width: 50px;
  min-height: 30px;
  color: #fff;
}

.badge-normal {
  background-color: #00aad2;
}

.badge-warning {
  background-color: #e63312;
  color: #fff;
}

.action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.empty-cell {
  padding: 40px;
  color: #888;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #eee;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #dee2e6;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #333;
}

.page-btn:hover:not(:disabled) {
  background: #f1f3f5;
  border-color: #ced4da;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-num {
  min-width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-weight: bold;
  color: #333;
  background: #fff;
}

.page-num.is-active {
  border-color: #002c5f;
  color: #002c5f;
}
</style>
