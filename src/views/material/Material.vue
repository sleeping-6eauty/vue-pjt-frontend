<template>
  <div class="material-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">자재 관리</h1>
        <p class="page-description">최신 자재 상태를 확인할 수 있습니다.</p>
      </div>
    </header>

    <MaterialTabs />

    <section class="stats-row" aria-label="자재 요약">
      <article class="stat-card">
        <p class="stat-label">전체 자재</p>
        <p class="stat-value">{{ summary.total }}<span class="unit">개</span></p>
      </article>
      <article class="stat-card">
        <p class="stat-label">주문 필요 항목</p>
        <p class="stat-value stat-warning">{{ summary.shortage }}<span class="unit">개</span></p>
      </article>
      <article class="stat-card">
        <p class="stat-label">정상 자재</p>
        <p class="stat-value stat-normal">{{ summary.normal }}<span class="unit">개</span></p>
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
        <span class="input-icon search" aria-hidden="true" />
        <input
          v-model.trim="filters.name"
          type="search"
          class="filter-input"
          placeholder="자재명 검색"
          @keydown.enter="applyFilters"
        />
      </div>
      <div class="filter-input-wrap">
        <span class="input-icon search" aria-hidden="true" />
        <input
          v-model.trim="filters.id"
          type="search"
          class="filter-input"
          placeholder="자재 ID 검색"
          @keydown.enter="applyFilters"
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
      <button type="button" class="btn btn-outline btn-search" @click="applyFilters">검색</button>
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
                    :disabled="(row.purchaseNeedQty ?? 0) <= 0"
                    @click="requestOrder(row.materialId)"
                  >
                    주문요청
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-order"
                    @click="useStock(row.materialId)"
                  >
                    사용
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
          v-for="page in totalPages"
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
  loadMaterials,
  requestMaterialOrder,
  useMaterialStock
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
      applied: {
        name: '',
        id: '',
        status: 'all'
      },
      sortKey: 'materialId',
      sortDir: 'asc',
      pageSize: 10,
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
      const { name, id, status } = this.applied
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
    applyFilters() {
      this.applied = {
        name: this.filters.name,
        id: this.filters.id,
        status: this.filters.status
      }
      this.currentPage = 1
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
    async requestOrder(materialId) {
      try {
        await requestMaterialOrder(materialId)
        await this.refreshMaterials()
      } catch (error) {
        console.error('Failed to request material order:', error)
        window.alert(error.message || '주문요청 처리에 실패했습니다.')
      }
    },
    async useStock(materialId) {
      try {
        await useMaterialStock(materialId)
        await this.refreshMaterials()
      } catch (error) {
        console.error('Failed to use material stock:', error)
        window.alert(error.message || '자재 사용 처리에 실패했습니다.')
      }
    },
    async adjustStock(materialId) {
      const row = this.materials.find((item) => item.materialId === materialId)
      const raw = window.prompt('조정 후 보유 재고값을 입력하세요.', String(row?.currentStock ?? 0))
      if (raw === null) return

      try {
        await adjustMaterialStock(materialId, raw)
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
  font-size: 28px;
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
  background: #f8f9fa;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
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
  padding: 20px 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid #eef0f2;
}

.stat-label {
  margin: 0 0 8px;
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.stat-value {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #111;
}

.stat-value .unit {
  font-size: 16px;
  font-weight: 600;
  margin-left: 2px;
}

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
  font-weight: 600;
}

.normal-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #a6dbe8;
  background: #e6f6fb;
  color: #007fa3;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f2;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.filter-input-wrap {
  position: relative;
  flex: 1 1 180px;
  min-width: 160px;
}

.filter-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px 10px 36px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
}

.input-icon.search {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border: 2px solid #adb5bd;
  border-radius: 50%;
  pointer-events: none;
}

.input-icon.search::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 2px;
  background: #adb5bd;
  right: -4px;
  bottom: -2px;
  transform: rotate(45deg);
  border-radius: 1px;
}

.status-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}

.status-label {
  font-size: 13px;
  font-weight: 600;
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

.btn-search {
  padding-left: 24px;
  padding-right: 24px;
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
  font-weight: 700;
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
  font-weight: 700;
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
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
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
  font-weight: 700;
  color: #333;
  background: #fff;
}

.page-num.is-active {
  border-color: #002c5f;
  color: #002c5f;
}
</style>
