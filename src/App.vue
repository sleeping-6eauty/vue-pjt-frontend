<template>
  <router-view />
</template>

<script>
import { useAuthStore } from '@/store/auth'

export default {
  name: 'App',
  created() {
    const authStore = useAuthStore()
    authStore.initializeAuth()
  }
}
</script>

<style>
/* 전역 기본 스타일 초기화 */
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #f8f9fa;
  color: #333;
}
a {
  text-decoration: none;
  color: inherit;
}
</style>
