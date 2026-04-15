<template>
  <div class="material-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">자재 관리</h1>
      </div>
    </header>

    <MaterialTabs />

    <div class="timeline-card">
      <div v-for="item in pagedRows" :key="item.id" class="timeline-row">
        <div class="timeline-date">
          <strong>{{ item.date }}</strong>
          <span>{{ item.time }}</span>
        </div>
        <div class="timeline-content">
          <div class="timeline-head">
            <h2>{{ item.materialName }}</h2>
            <span class="change-badge" :class="item.type">{{ item.typeLabel }}</span>
          </div>
          <p class="timeline-meta">{{ item.materialId }} · {{ item.reason }}</p>
          <p class="timeline-qty">
            변동 수량
            <strong :class="item.delta > 0 ? 'plus' : 'minus'">
              {{ item.delta > 0 ? '+' : '' }}{{ item.delta }}
            </strong>
            / 변경 후 재고 {{ item.afterStock }}
          </p>
        </div>
      </div>
      <div v-if="!pagedRows.length" class="empty-cell">표시할 이력이 없습니다.</div>
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
</template>

<script>
import MaterialTabs from '@/components/material/MaterialTabs.vue'
import { loadMaterialHistory } from '../../store/material'

export default {
  name: 'MaterialHistory',
  components: { MaterialTabs },
  data() {
    return {
      historyRows: [],
      pageSize: 10,
      currentPage: 1
    }
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.historyRows.length / this.pageSize))
    },
    pagedRows() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.historyRows.slice(start, start + this.pageSize)
    }
  },
  watch: {
    historyRows() {
      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages
    }
  },
  async mounted() {
    try {
      this.historyRows = await loadMaterialHistory()
    } catch (error) {
      console.error('Failed to load material history from server:', error)
      this.historyRows = []
      window.alert(error.message || '서버에서 재고 이력 데이터를 불러오지 못했습니다.')
    }
  }
}
</script>

<style scoped>
.material-page {
  width: 100%;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 25px;
  font-weight: bold;
  color: #111;
}

.page-description {
  margin: 0;
  color: #666;
}

.timeline-card {
  background: #fff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  padding: 8px 24px;
}

.timeline-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 20px;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.timeline-row:last-child {
  border-bottom: none;
}

.empty-cell {
  padding: 40px;
  text-align: center;
  color: #888;
}

.timeline-date {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #495057;
}

.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.timeline-head h2 {
  margin: 0;
  font-size: 18px;
}

.timeline-meta,
.timeline-qty {
  margin: 0;
  color: #666;
}

.timeline-qty {
  margin-top: 8px;
}

.change-badge {
  padding: 4px 12px;
  border-radius: 999px;
  color: #fff;
  font-size: 15px;
  font-weight: bold;
}

.change-badge.in {
  background: #00aad2;
}

.change-badge.out {
  background: #E63312;
}

.change-badge.adjust {
  background: #f19985;
}

.plus {
  color: #00aad2;
}

.minus {
  color: #E63312;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
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

@media (max-width: 768px) {
  .timeline-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .timeline-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
