<template>
  <div style="font-size: 25px; font-weight: bold; margin-bottom: 24px;">주문 현황 집계</div>
  <div class="order-container">

      <div class="summary-cards">
        <article class="summary-card">

          <div class="summary-text">
            <p>총 주문 건수</p>
            <strong>{{ summary.totalOrders }}</strong>
          </div>
        </article>

        <article class="summary-card">
          <div class="summary-text">
            <p>대기 중인 주문</p>
            <strong style="color: #b97710;">{{ summary.pendingOrders }}</strong>
          </div>
        </article>

        <article class="summary-card">
          <div class="summary-text">
            <p>완료된 주문</p>
            <strong style="color: #2f66c9;">{{ summary.completedOrders }}</strong>
          </div>
        </article>
      </div>

    <section class="panel filter-panel">
      <div class="filters-grid">
        <select v-model="filters.vehicleType" class="filter-select" @change="applyFilters">
          <option value="">차종 전체</option>
          <option v-for="item in filterOptions.vehicleTypes" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="filters.engine" class="filter-select" @change="applyFilters">
          <option value="">엔진 전체</option>
          <option v-for="item in filterOptions.engines" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="filters.drive" class="filter-select" @change="applyFilters">
          <option value="">구동 전체</option>
          <option v-for="item in filterOptions.drives" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="filters.tire" class="filter-select" @change="applyFilters">
          <option value="">타이어 전체</option>
          <option v-for="item in filterOptions.tires" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="filters.seat" class="filter-select" @change="applyFilters">
          <option value="">시트 전체</option>
          <option v-for="item in filterOptions.seats" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="filters.option" class="filter-select" @change="applyFilters">
          <option value="">옵션 전체</option>
          <option value="__NONE__">옵션 없음(-)</option>
          <option v-for="item in filterOptions.options" :key="item" :value="item">{{ item }}</option>
        </select>
        <button class="reset-btn" type="button" @click="resetFilters">필터 초기화</button>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="panel table-panel">
        <div class="section-header">
          <h2>
            주문 상세
            <span v-if="hasActiveFilters" class="filtered-count">({{ totalCount }}건)</span>
          </h2>
          <button class="csv-btn" type="button" @click="downloadCsv">CSV 다운로드</button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>주문ID</th>
                <th>차종</th>
                <th>엔진</th>
                <th>구동</th>
                <th>타이어</th>
                <th>시트</th>
                <th>추가 옵션</th>
                <th>주문일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tableRows.length === 0">
                <td colspan="9" class="empty-row">{{ loading ? '로딩 중...' : '조회 결과가 없습니다.' }}</td>
              </tr>
              <tr v-for="row in tableRows" :key="row.orderId">
                <td>{{ row.orderId }}</td>
                <td>{{ row.vehicleType }}</td>
                <td>{{ displayValue(row.engine) }}</td>
                <td>{{ displayValue(row.drive) }}</td>
                <td>{{ displayValue(row.tire) }}</td>
                <td>{{ displayValue(row.seat) }}</td>
                <td class="option-cell">{{ displayValue(row.option) }}</td>
                <td>{{ row.orderDate }}</td>
                <td>
                  <span class="badge" :class="statusClass(row.orderStatus)">{{ row.orderStatus }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button class="page-btn nav-btn" :disabled="page === 1" @click="changePage(page - 1)" title="이전">◀</button>
          <button
            v-for="num in visiblePages"
            :key="num"
            class="page-btn"
            :class="{ active: page === num }"
            @click="changePage(num)"
          >
            {{ num }}
          </button>
          <button class="page-btn nav-btn" :disabled="page >= totalPages" @click="changePage(page + 1)" title="다음">▶</button>
        </div>
      </div>

      <div class="panel chart-panel">
        <div class="section-header">
          <h2>차종별 주문 비율</h2>
        </div>

        <div class="chart-wrap">
          <div class="pie-chart" :style="{ background: pieGradient }" aria-label="차종별 주문 비율 차트">
            <div
              class="pie-label"
              v-for="segment in chartSegments"
              :key="segment.vehicleType"
              :style="{ top: segment.top, left: segment.left }"
            >
              {{ segment.percentText }}
            </div>
          </div>

          <div class="legend">
            <div class="legend-item" v-for="item in vehicleRatio" :key="item.vehicleType">
              <span class="legend-color" :style="{ background: colorMap[item.vehicleType] || '#999' }"></span>
              <span>{{ item.vehicleType }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
const API_BASE = "http://127.0.0.1:8080";

export default {
  name: 'Order',
  data() {
    return {
      loading: false,
      page: 1,
      size: 5,
      totalCount: 0,
      summary: {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
      },
      vehicleRatio: [],
      tableRows: [],
      filterOptions: {
        vehicleTypes: [],
        engines: [],
        drives: [],
        tires: [],
        seats: [],
        options: [],
      },
      filters: {
        vehicleType: "",
        engine: "",
        drive: "",
        tire: "",
        seat: "",
        option: "",
      },
      colorMap: {
        G70: "#4fa8ff",
        G80: "#5fbe73",
        G90: "#ffae3a",
      },
    };
  },
  computed: {
    hasActiveFilters() {
      return Object.values(this.filters).some((value) => !!value);
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.totalCount / this.size));
    },
    visiblePages() {
      const pages = [];
      const start = Math.max(1, this.page - 2);
      const end = Math.min(this.totalPages, start + 4);
      for (let i = start; i <= end; i += 1) {
        pages.push(i);
      }
      return pages;
    },
    pieGradient() {
      if (!this.vehicleRatio.length) {
        return "conic-gradient(#d9dde2 0 100%)";
      }

      let current = 0;
      const segments = this.vehicleRatio.map((item) => {
        const ratio = Number(item.ratio || 0);
        const start = current;
        current += ratio * 100;
        return `${this.colorMap[item.vehicleType] || "#999"} ${start}% ${current}%`;
      });
      return `conic-gradient(from -90deg, ${segments.join(", ")})`;
    },
    chartSegments() {
      let current = -90;
      const radius = 34;

      return this.vehicleRatio.slice(0, 3).map((item) => {
        const ratio = Number(item.ratio || 0);
        const angleSize = ratio * 360;
        const mid = current + angleSize / 2;
        const rad = (mid * Math.PI) / 180;
        const x = 50 + radius * Math.cos(rad);
        const y = 50 + radius * Math.sin(rad);
        current += angleSize;

        return {
          vehicleType: item.vehicleType,
          percentText: `${Math.round(ratio * 100)}%`,
          top: `${y}%`,
          left: `${x}%`,
        };
      });
    },
  },
  methods: {
    async fetchSummary() {
      try {
        const res = await fetch(`${API_BASE}/orders/summary`);
        this.summary = await res.json();
      } catch (error) {
        console.error("요약 정보 로드 실패:", error);
      }
    },
    async fetchVehicleRatio() {
      try {
        const res = await fetch(`${API_BASE}/orders/vehicle-ratio`);
        const data = await res.json();
        this.vehicleRatio = Array.isArray(data) ? data : data.value || [];
      } catch (error) {
        console.error("차종 비율 로드 실패:", error);
      }
    },
    async fetchFilterOptions() {
      try {
        const res = await fetch(`${API_BASE}/orders/filter-options`);
        this.filterOptions = await res.json();
      } catch (error) {
        console.error("필터 옵션 로드 실패:", error);
      }
    },
    async fetchTotalCount() {
      try {
        const params = this.buildFilterParams();
        const res = await fetch(`${API_BASE}/orders/table/count?${params.toString()}`);
        const data = await res.json();
        this.totalCount = Number(data || 0);
      } catch (error) {
        console.error("전체 개수 로드 실패:", error);
      }
    },
    buildFilterParams(withPaging = false) {
      const params = new URLSearchParams();
      if (withPaging) {
        params.set("page", String(this.page));
        params.set("size", String(this.size));
      }

      Object.entries(this.filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });
      return params;
    },
    async fetchTableRows() {
      try {
        const params = this.buildFilterParams(true);
        const res = await fetch(`${API_BASE}/orders/table?${params.toString()}`);
        const data = await res.json();
        this.tableRows = Array.isArray(data) ? data : data.value || [];
      } catch (error) {
        console.error("테이블 데이터 로드 실패:", error);
      }
    },
    async refreshTable() {
      this.loading = true;
      try {
        await Promise.all([this.fetchTotalCount(), this.fetchTableRows()]);
      } catch (error) {
        console.error("테이블 새로고침 실패:", error);
      } finally {
        this.loading = false;
      }
    },
    async applyFilters() {
      this.page = 1;
      await this.refreshTable();
    },
    async resetFilters() {
      this.filters = {
        vehicleType: "",
        engine: "",
        drive: "",
        tire: "",
        seat: "",
        option: "",
      };
      this.page = 1;
      await this.refreshTable();
    },
    async changePage(nextPage) {
      if (nextPage < 1 || nextPage > this.totalPages) {
        return;
      }
      this.page = nextPage;
      await this.refreshTable();
    },
    async downloadCsv() {
      try {
        const params = this.buildFilterParams();
        params.set("page", "1");
        params.set("size", String(Math.max(this.totalCount, 1)));

        const res = await fetch(`${API_BASE}/orders/table?${params.toString()}`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data.value || [];
        if (!rows.length) {
          alert("다운로드할 데이터가 없습니다.");
          return;
        }

        const headers = ["주문ID", "차종", "엔진", "구동", "타이어", "시트", "추가 옵션", "주문일", "상태"];
        const body = rows.map((row) => [
          row.orderId,
          row.vehicleType,
          this.displayValue(row.engine),
          this.displayValue(row.drive),
          this.displayValue(row.tire),
          this.displayValue(row.seat),
          this.displayValue(row.option),
          row.orderDate,
          row.orderStatus,
        ]);

        const csv = [headers, ...body]
          .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
          .join("\n");

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orders_table.csv";
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("CSV 다운로드 실패:", error);
        alert("CSV 다운로드 중 오류가 발생했습니다.");
      }
    },
    statusClass(status) {
      const upper = String(status || "").toUpperCase();
      if (upper === "COMPLETED") {
        return "completed";
      }
      if (upper === "PENDING") {
        return "pending";
      }
      return "progress";
    },
    displayValue(value) {
      return value === null || value === undefined || value === "" ? "-" : value;
    },
  },
  async mounted() {
    try {
      this.loading = true;
      await Promise.all([this.fetchSummary(), this.fetchVehicleRatio(), this.fetchFilterOptions()]);
      await this.refreshTable();
    } catch (error) {
      console.error("초기 데이터 로딩 실패:", error);
      alert("API 연결에 실패했습니다. 백엔드 서버 상태와 CORS 설정을 확인해주세요.");
    } finally {
      this.loading = false;
    }
  },
};
</script>

<style scoped>
:root {
  --bg: #efefef;
  --panel: #f6f6f6;
  --white: #ffffff;
  --border: #dddddd;
  --text: #111111;
  --muted: #909090;
  --navy: #032f6c;
  --navy-2: #0b3a78;
  --blue: #45a4ff;
  --green: #5fc36f;
  --orange: #f7a629;
  --shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.order-container {
  width: 100%;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid #eef0f2;
  margin-bottom: 24px;
}

.summary-panel h1,
.section-header h2 {
  margin: 0 0 18px;
  font-size: 28px;
  line-height: 1.2;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.summary-card {
  background: #fff;
  border: 1px solid #eef0f2;
  border-radius: 12px;
  padding: 30px 20px;
  display: flex;
  align-items: center;
  /* gap: 18px; */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.summary-icon {
  width: 74px;
  height: 74px;
  object-fit: contain;
  flex-shrink: 0;
}

.summary-text p {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: bold;
  color: #666;
}

.summary-text strong {
  font-size: 40px;
  line-height: 1;
  font-weight: bold;
}

.card-icon {
  width: 58px;
  height: 58px;
}

.filter-panel {
  margin-top: 24px;
  display: block;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr)) 120px;
  gap: 12px;
  align-items: center;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filtered-count {
  margin-left: 8px;
  font-size: 20px;
  color: #4f5f72;
}

.csv-btn {
  height: 38px;
  border: 1px solid #dee2e6;
  background: #fff;
  color: #425367;
  border-radius: 8px;
  padding: 0 12px;
  font-weight: 700;
  cursor: pointer;
}

.filter-select {
  width: 100%;
  height: 52px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background: #fff;
  color: #2e3a45;
  padding: 0 12px;
  font-weight: 600;
}

.reset-btn {
  width: 100%;
  height: 52px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: #fff;
  color: #4f5f72;
  font-weight: 700;
  cursor: pointer;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-box svg {
  width: 22px;
  height: 22px;
  fill: #8a8a8a;
  flex-shrink: 0;
}

.search-box input {
  width: 100%;
  border: 0;
  background: transparent;
  outline: none;
  color: #444;
}

.search-box input::placeholder {
  color: #8a8a8a;
  font-weight: 600;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.5fr) minmax(280px, 0.8fr);
  gap: 24px;
}

.table-panel {
  display: flex;
  flex-direction: column;
  min-height: 620px;
}

.table-wrap {
  border-radius: 12px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eef0f2;
  flex: 1;
  min-height: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.table-wrap table {
  width: 100%;
  border-collapse: collapse;
}

.table-wrap th,
.table-wrap td {
  padding: 16px 14px;
  font-size: 15px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.table-wrap th {
  background: #f1f3f5;
  color: #525f70;
  font-weight: 700;
}

.table-wrap td {
  background: #fff;
  color: #28323d;
  vertical-align: top;
}

.empty-row {
  text-align: center !important;
  color: #69778a !important;
}

.option-cell {
  max-width: 220px;
  white-space: normal;
  line-height: 1.35;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 110px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
}

.badge.completed {
  background: #dff2e0;
  color: #318045;
}

.badge.pending {
  background: #fff0d6;
  color: #b97710;
}

.badge.progress {
  background: #dde8ff;
  color: #2f66c9;
}

.pagination {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 20px;
  flex-shrink: 0;
}

.page-btn {
  border: 1px solid #d6dbe2;
  background: #fff;
  min-width: 32px;
  padding: 0 8px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.page-btn.active {
  background: #032f6c;
  color: #fff;
  font-weight: 700;
  border-color: #032f6c;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn.nav-btn {
  min-width: 32px;
  padding: 0;
  font-size: 14px;
}

.page-dots {
  color: #707070;
  font-weight: 700;
}

.chart-panel {
  min-height: 480px;
}

.chart-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100% - 56px);
}

.pie-chart {
  width: 260px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(
    from -90deg,
    #5fbe73 0 48%,
    #ffae3a 48% 68%,
    #4fa8ff 68% 100%
  );
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06), inset 0 0 0 6px #fff;
}

.pie-hole {
  display: none;
}

.pie-label {
  position: absolute;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transform: translate(-50%, -50%);
}

.legend {
  margin-top: 30px;
  display: flex;
  gap: 34px;
  flex-wrap: wrap;
  justify-content: center;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-color.g70 {
  background: #4fa8ff;
}
.legend-color.g80 {
  background: #5fbe73;
}
.legend-color.g90 {
  background: #ffae3a;
}

@media (max-width: 1400px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-select,
  .reset-btn {
    width: 100%;
  }
}
</style>
