<template>
  <aside class="sidebar">
    <div class="logo-area">
      <img src="@/assets/images/logo.png" style="width: 103px; height: 62px;" alt="HYUNDAI Logo" class="logo-image" />
    </div>

    <nav class="menu-nav">
      <ul>
        <li>
          <router-link to="/admin/bom" active-class="active-menu">BOM 조회</router-link>
        </li>
        <li>
          <router-link to="/admin/material" active-class="active-menu">자재 관리</router-link>
        </li>
        <li>
          <router-link to="/admin/order" active-class="active-menu">주문 현황</router-link>
        </li>
        <li>
          <router-link to="/admin/permission" active-class="active-menu">권한 관리</router-link>
        </li>
      </ul>
    </nav>

    <div class="logout-area">
      <button class="btn-logout" @click="handleLogout">
        <span class="icon">🚪</span> Log out
      </button>
    </div>
  </aside>
</template>

<script>
import { useAuthStore } from '@/store/auth'

export default {
  name: 'Sidebar',
  methods: {
    handleLogout() {
      const authStore = useAuthStore();
      authStore.logout();
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eaeaea;
}

.logo-area {
  padding-top: 44px;
  padding-bottom: 90px;
  text-align: center;
}

.logo-text {
  color: #002c5f; /* 현대 블루 */
  margin: 0;
  font-size: 24px;
}

.menu-nav {
  flex: 1;
  padding-top: 20px;
}

.menu-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-nav a {
  display: block;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  transition: all 0.2s ease;
}

.menu-nav a:hover {
  background-color: #f1f3f5;
}

/* 활성화된 메뉴 스타일 (남색 배경, 흰 글씨) */
.active-menu {
  background-color: #002c5f !important;
  color: #ffffff !important;
  border-radius: 20px; /* 우측 라운드 처리 */
}

.logout-area {
  padding: 20px;
}

.btn-logout {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>