import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,    // 예: { empId: 'aisj...', name: '홍길동', role: 'Admin' }
    token: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'Admin'
  },
  actions: {
    login(userData, token) {
      this.user = userData;
      this.token = token;
      // 필요시 localStorage나 sessionStorage에 토큰 저장
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', userData.role);
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
    }
  }
})