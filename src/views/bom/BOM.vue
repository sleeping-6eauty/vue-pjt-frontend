<template>
  <main class="main-container">
    <section class="bom-page">
      <h2 class="page-title">자재 카테고리</h2>

        <div class="top-bar">
          <div class="category-tabs">
            <button
              v-for="category in categories"
              :key="category"
              :class="['tab-btn', { active: selectedCategory === category }]"
              @click="selectedCategory = category"
            >
              {{ category }}
            </button>
          </div>

          <div class="search-box">
            <span class="search-icon">⌕</span>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="자재명 검색"
            />
          </div>
        </div>
      <div class="content-grid">
        <section class="bom-card">
          <h3 class="card-title">BOM 조회</h3>

          <div class="table-wrapper">
            <table class="bom-table">
              <thead>
                <tr>
                  <th>품번</th>
                  <th>자재명</th>
                  <th>수량</th>
                  <th>단위</th>
                  <th>공정투입정보</th>
                  <th>차량</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in pagedBomList" :key="item.id">
                  <td>{{ item.partNo }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ item.process }}</td>
                  <td>
                    <span class="car-badge" :class="item.badgeType">
                      {{ item.car }}
                    </span>
                  </td>
                </tr>
                <tr v-if="pagedBomList.length === 0">
                  <td colspan="6">검색 결과가 없습니다.</td>
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
        </section>

        <aside class="price-card">
          <h3 class="card-title">가격 조회</h3>

          <div class="price-list">
            <div
              v-for="price in filteredPriceList"
              :key="price.id"
              class="price-item"
            >
              <div class="price-info">
                <p class="price-name">{{ price.name }}</p>
                <p class="price-desc">{{ price.desc }}</p>
              </div>
              <p class="price-value">{{ price.price.toLocaleString() }}</p>
            </div>

            <div v-if="filteredPriceList.length === 0" class="price-empty">
              검색 결과가 없습니다.
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const categories = ["전체", "엔진", "구동", "타이어", "시트", "옵션"];
const selectedCategory = ref("전체");
const searchKeyword = ref("");

const bomList = ref([]);
const priceList = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const currentPage = ref(1);
const pageSize = ref(5);

const getBadgeType = (car) => {
  if (car === "G70") return "mint";
  if (car === "G80") return "blue";
  if (car === "G90") return "beige";
  if (car === "GV80") return "beige";
  return "blue";
};

const loadBomPage = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch("http://localhost:8080/api/bom/page");

    if (!response.ok) {
      throw new Error("서버 응답 오류");
    }

    const data = await response.json();

    bomList.value = (data.bomList || []).map((item) => ({
      ...item,
      badgeType: getBadgeType(item.car),
    }));

    priceList.value = (data.priceList || []).map((item) => ({
      ...item,
      desc: item.description ?? "",
    }));
  } catch (error) {
    console.error(error);
    errorMessage.value = "데이터를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
};

const filteredBomList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return bomList.value.filter((item) => {
    const matchCategory =
      selectedCategory.value === "전체" ||
      item.category === selectedCategory.value;

    const matchKeyword =
      !keyword ||
      String(item.partNo ?? "").toLowerCase().includes(keyword) ||
      String(item.name ?? "").toLowerCase().includes(keyword) ||
      String(item.process ?? "").toLowerCase().includes(keyword) ||
      String(item.car ?? "").toLowerCase().includes(keyword);

    return matchCategory && matchKeyword;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredBomList.value.length / pageSize.value))
);

const visiblePages = computed(() => {
  const pages = [];
  let start = Math.max(1, currentPage.value - 2);
  let end = Math.min(totalPages.value, start + 4);
  start = Math.max(1, end - 4);
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
});

const pagedBomList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredBomList.value.slice(start, start + pageSize.value);
});

const filteredPriceList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return priceList.value.filter((item) => {
    const matchCategory =
      selectedCategory.value === "전체" ||
      item.category === selectedCategory.value;

    const matchKeyword =
      !keyword ||
      String(item.name ?? "").toLowerCase().includes(keyword) ||
      String(item.desc ?? "").toLowerCase().includes(keyword) ||
      String(item.price ?? "").includes(keyword);

    return matchCategory && matchKeyword;
  });
});

watch([selectedCategory, searchKeyword], () => {
  currentPage.value = 1;
});

watch(filteredBomList, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
});

onMounted(() => {
  loadBomPage();
});
</script>

<style scoped>
.main-container {
  box-sizing: border-box;
}

.bom-page {
  width: 100%;
  padding: 0;
  margin: 0;
}

.page-title {
  font-size: 25px;
  font-weight: bold;
  color: #111;
  margin: 0 0 20px 0;
}

.top-bar {
  display: grid;
  grid-template-columns: 2.6fr 0.9fr;
  gap: 20px;
  margin-bottom: 26px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  border-radius: 12px;
}

.category-tabs {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F1F3F5;
  border-radius: 30px;
  padding: 8px;
  min-height: 56px;
  box-sizing: border-box;
  justify-content: space-between;
  padding-left: 30px;
  padding-right: 30px;
  border: 1px solid #eef0f2;
}

.tab-btn {
  border: none;
  background: transparent;
  color: #222;
  font-size: 14px;
  padding: 10px 40px;
  border-radius: 999px;
  cursor: pointer;
}

.tab-btn.active {
  background: #FFFFFF;
  font-weight: 700;
}

.search-box {
  width: 100%;
  min-width: 0;
  height: 56px;
  background: #F1F3F5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  box-sizing: border-box;
}

.search-icon {
  color: #8a8a8a;
  font-size: 30px;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #333;
}

.search-box input::placeholder {
  color: #8a8a8a;
}

.content-grid {
  display: grid;
  grid-template-columns: 2.6fr 0.9fr;
  gap: 20px;
}

.bom-card,
.price-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  min-height: 650px;
  box-sizing: border-box;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid #eef0f2;
}

.card-title {
  font-size: 25px;
  font-weight: bold;
  color: #111;
  margin-bottom: 18px;
}

.table-wrapper {
  max-height: 470px;
  overflow-y: auto;
  padding-right: 4px;
}

.bom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.bom-table thead th {
  background: #F1F3F5;
  color: #111;
  font-size: 15px;
  font-weight: 700;
  padding: 18px 14px;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 2;
}

.bom-table thead th:first-child {
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
}

.bom-table thead th:last-child {
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
}

.bom-table tbody td {
  text-align: center;
  padding: 16px 14px;
  font-size: 15px;
  color: #222;
  border-bottom: 1px solid #d8d8d8;
}

.car-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  height: 36px;
  padding: 0 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  color: white;
}

.car-badge.mint {
  background: #79cfe5;
}

.car-badge.blue {
  background: #9dbfdf;
}

.car-badge.beige {
  background: #d8d0c9;
  color: #fff;
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

.price-list {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 6px;
  margin-top: 6px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 10px;
  border-bottom: 1px solid #e5e5e5;
}

.price-name {
  font-size: 18px;
  font-weight: bold;
  color: #0d3a78;
  margin: 0 0 4px 0;
}

.price-desc {
  font-size: 13px;
  color: #8e8e8e;
  margin: 0;
}

.price-value {
  font-size: 18px;
  font-weight: bold;
  color: #111;
  margin: 0;
}
</style>
