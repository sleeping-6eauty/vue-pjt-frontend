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
            placeholder="자재명을 검색하세요."
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
                <tr v-for="item in filteredBomList" :key="item.id">
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
                <tr v-if="filteredBomList.length === 0">
                  <td colspan="6">검색 결과가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
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
import { ref, computed } from "vue";

const categories = ["전체", "차량", "엔진", "구동", "타이어", "시트", "옵션"];
const selectedCategory = ref("전체");
const searchKeyword = ref("");

const bomList = ref([
  {
    id: 1,
    category: "엔진",
    partNo: 10,
    name: "엔진",
    quantity: 2,
    unit: "개",
    process: "내장",
    car: "G90",
    badgeType: "mint",
  },
  {
    id: 2,
    category: "엔진",
    partNo: 11,
    name: "엔진 커버",
    quantity: 1,
    unit: "개",
    process: "내장",
    car: "G80",
    badgeType: "blue",
  },
  {
    id: 3,
    category: "타이어",
    partNo: 21,
    name: "타이어",
    quantity: 4,
    unit: "개",
    process: "외장",
    car: "GV80",
    badgeType: "beige",
  },
  {
    id: 4,
    category: "시트",
    partNo: 31,
    name: "운전석 시트",
    quantity: 1,
    unit: "개",
    process: "내장",
    car: "G90",
    badgeType: "mint",
  },
]);

const priceList = ref([
  {
    id: 1,
    category: "엔진",
    name: "엔진",
    desc: "외부 공정",
    price: 10000,
  },
  {
    id: 2,
    category: "엔진",
    name: "엔진 커버",
    desc: "외부 공정",
    price: 7000,
  },
  {
    id: 3,
    category: "타이어",
    name: "타이어",
    desc: "외부 공정",
    price: 20000,
  },
  {
    id: 4,
    category: "시트",
    name: "운전석 시트",
    desc: "내부 공정",
    price: 15000,
  },
]);

const filteredBomList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return bomList.value.filter((item) => {
    const matchCategory =
      selectedCategory.value === "전체" ||
      item.category === selectedCategory.value;

    const matchKeyword =
      !keyword ||
      String(item.partNo).toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      item.process.toLowerCase().includes(keyword) ||
      item.car.toLowerCase().includes(keyword);

    return matchCategory && matchKeyword;
  });
});

const filteredPriceList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return priceList.value.filter((item) => {
    const matchCategory =
      selectedCategory.value === "전체" ||
      item.category === selectedCategory.value;

    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.desc.toLowerCase().includes(keyword) ||
      String(item.price).includes(keyword);

    return matchCategory && matchKeyword;
  });
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
}

.category-tabs {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F1F3F5;
  border-radius: 16px;
  padding: 8px;
  min-height: 56px;
  box-sizing: border-box;
  justify-content: space-between;
  padding-left: 30px;
  padding-right: 30px;
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
  border-radius: 16px;
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
  border-radius: 20px;
  padding: 20px;
  min-height: 580px;
  box-sizing: border-box;
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
  min-width: 76px;
  height: 36px;
  padding: 0 16px;
  border-radius: 14px;
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
