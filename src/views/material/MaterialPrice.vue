<template>
  <div class="material-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">자재 관리</h1>
        <p class="page-description">자재별 기준 단가를 확인합니다.</p>
      </div>
    </header>

    <MaterialTabs />

    <section class="summary-grid">
      <article class="summary-card">
        <p class="summary-label">등록 자재</p>
        <p class="summary-value">{{ rows.length }}개</p>
      </article>
      <article class="summary-card">
        <p class="summary-label">평균 단가</p>
        <p class="summary-value">{{ formatCurrency(avgPrice) }}</p>
      </article>
      <article class="summary-card">
        <p class="summary-label">최고 단가 자재</p>
        <p class="summary-value">{{ highestPrice.name }}</p>
      </article>
    </section>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>자재 ID</th>
            <th>자재명</th>
            <th>카테고리</th>
            <th>기준 단가</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.materialId">
            <td>{{ row.materialId }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.vendor }}</td>
            <td>{{ formatCurrency(row.unitPrice) }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="4">표시할 가격 데이터가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import MaterialTabs from '@/components/material/MaterialTabs.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default {
  name: 'MaterialPrice',
  components: { MaterialTabs },
  data() {
    return {
      rows: []
    }
  },
  computed: {
    avgPrice() {
      if (!this.rows.length) return 0
      return Math.round(this.rows.reduce((sum, row) => sum + row.unitPrice, 0) / this.rows.length)
    },
    highestPrice() {
      if (!this.rows.length) {
        return { name: '-' }
      }
      return this.rows.reduce((max, row) => (row.unitPrice > max.unitPrice ? row : max), this.rows[0])
    }
  },
  async mounted() {
    await this.loadPriceRows()
  },
  methods: {
    async loadPriceRows() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/bom/page`)
        if (!response.ok) {
          throw new Error(`API request failed (${response.status})`)
        }

        const payload = await response.json()
        const rawRows = Array.isArray(payload?.priceList) ? payload.priceList : []
        this.rows = rawRows.map((row) => ({
          materialId: row?.id ?? '',
          name: row?.name ?? '',
          vendor: row?.category ?? '',
          unitPrice: Number(row?.price ?? 0)
        }))
      } catch (error) {
        console.error('Failed to load material price rows:', error)
        this.rows = []
        window.alert(error.message || '가격 정보를 불러오지 못했습니다.')
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0
      }).format(value)
    }
  }
}
</script>

<style scoped>
.material-page {
  width: 100%;
}

.page-header {
  margin-bottom: 20px;
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card,
.table-card {
  background: #fff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.summary-card {
  padding: 20px 24px;
}

.summary-label {
  margin: 0 0 8px;
  color: #666;
  font-weight: 600;
}

.summary-value {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .table-card {
    overflow-x: auto;
  }

  .data-table {
    min-width: 760px;
  }
}
</style>
