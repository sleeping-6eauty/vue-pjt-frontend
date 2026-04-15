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
      this.user = userData
      this.token = token

      localStorage.setItem('authToken', token)
      localStorage.setItem('authUser', JSON.stringify(userData))
      localStorage.setItem('userRole', userData.role)
    },

    logout() {
      this.user = null
      this.token = null

      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      localStorage.removeItem('userRole')
    },

    initializeAuth() {
      const token = localStorage.getItem('authToken')
      const user = localStorage.getItem('authUser')

      this.token = token || null
      this.user = user ? JSON.parse(user) : null
    }
  }
})
