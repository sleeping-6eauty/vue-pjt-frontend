<template>
  <nav class="material-tabs" aria-label="자재 관리 탭">
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tab-link"
      :class="{ 'tab-link-active': $route.path === tab.to }"
    >
      {{ tab.label }}
    </router-link>
  </nav>
</template>

<script>
export default {
  name: 'MaterialTabs',
  data() {
    return {
      tabs: [
        { label: '최신 재고 현황', to: '/admin/material' },
        { label: '재고 변동 이력', to: '/admin/material/history' }
      ]
    }
  }
}
</script>

<style scoped>
.material-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-link {
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #d0d7de;
  background: #fff;
  color: #495057;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.tab-link:visited {
  color: #495057;
}

.tab-link:hover {
  border-color: #002c5f;
  color: #002c5f;
}

.tab-link-active {
  background: #002c5f;
  border-color: #002c5f;
  color: #fff;
}

.tab-link-active:visited,
.tab-link-active:hover {
  color: #fff;
}
</style>
