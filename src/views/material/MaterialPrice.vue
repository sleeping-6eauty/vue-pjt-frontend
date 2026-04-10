<template>
  <div class="material-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">자재 관리</h1>
        <p class="page-description">자재별 기준 단가와 최근 가격 변동을 확인합니다.</p>
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
            <th>공급처</th>
            <th>기준 단가</th>
            <!-- <th>최근 변동률</th>
            <th>최종 갱신일</th> -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.materialId">
            <td>{{ row.materialId }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.vendor }}</td>
            <td>{{ formatCurrency(row.unitPrice) }}</td>
            <!-- <td :class="row.changeRate > 0 ? 'up-rate' : 'down-rate'">{{ row.changeRate }}%</td>
            <td>{{ row.updatedAt }}</td> -->
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import MaterialTabs from '@/components/material/MaterialTabs.vue'

const PRICE_ROWS = [
  { materialId: 'G80-ENGINE-001', name: '가솔린 3.5 터보', vendor: '현대모비스', unitPrice: 85000, changeRate: 4.2, updatedAt: '2026-04-09' },
  { materialId: 'MAT-002', name: '너트 B', vendor: '한성정밀', unitPrice: 12000, changeRate: 1.1, updatedAt: '2026-04-08' },
  { materialId: 'MAT-003', name: '패널 C', vendor: '동서패널', unitPrice: 4300, changeRate: -0.8, updatedAt: '2026-04-07' }
]

export default {
  name: 'MaterialPrice',
  components: { MaterialTabs },
  data() {
    return {
      rows: PRICE_ROWS
    }
  },
  computed: {
    avgPrice() {
      return Math.round(this.rows.reduce((sum, row) => sum + row.unitPrice, 0) / this.rows.length)
    },
    highestPrice() {
      return this.rows.reduce((max, row) => (row.unitPrice > max.unitPrice ? row : max), this.rows[0])
    }
  },
  methods: {
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

.up-rate {
  color: #dc3545;
  font-weight: 700;
}

.down-rate {
  color: #2b8a3e;
  font-weight: 700;
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
