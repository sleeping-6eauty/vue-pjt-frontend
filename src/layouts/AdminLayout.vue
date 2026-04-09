<template>
  <div class="admin-layout">
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import Sidebar from '@/components/layout/Sidebar.vue'

export default {
  name: 'AdminLayout',
  components: { Sidebar }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
}
.main-content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}
</style>