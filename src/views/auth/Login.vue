<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo">HYUNDAI</div> 
      
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <input type="email" v-model="form.email" placeholder="이메일" required />
        </div>
        <div class="input-group">
          <input type="password" v-model="form.password" placeholder="비밀번호" required />
        </div>
        <div v-if="message" class="message">{{ message }}</div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
      
      <div class="links">
        <router-link to="/signup">계정 등록</router-link>
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

import { useAuthStore } from '@/store/auth'

export default {
  name: 'Login',
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      message: '',
      loading: false
    }
  },
  methods: {
    async handleLogin() {
      this.message = ''
      this.loading = true

      const loginData = {
        email: this.form.email.trim(),
        password: this.form.password
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loginData)
        })

        const result = await response.json()
        console.log('Login response:', response.status, result)
        console.log('result.status:', result.status, 'result.role:', result.role)

        if (!response.ok) {
          this.message = result.message || '이메일 또는 비밀번호가 틀립니다.'
          return
        }

        if (result.status === 'Pending') {
          this.message = '승인 대기 중입니다. 관리자 승인을 기다려주세요.'
          return
        }

        if (result.status === 'Deleted') {
          this.message = '삭제된 계정입니다. 관리자에게 문의하세요.'
          return
        }

        // authStore에 사용자 정보 저장
        const authStore = useAuthStore()
        authStore.login({
          employeeId: result.employeeId,
          name: result.name,
          email: result.email,
          role: result.role
        }, 'dummy-token') // 실제 토큰이 있다면 사용

        console.log('About to navigate...')
        const nextRoute = result.role === 'Admin' ? '/admin/permission' : '/admin/bom'
        console.log('Navigating to:', nextRoute)
        try {
          await this.$router.push(nextRoute)
          console.log('Navigation successful')
        } catch (navError) {
          console.error('Navigation failed:', navError)
          this.message = '페이지 이동 중 오류가 발생했습니다.'
        }
      } catch (error) {
        console.error('Login API error:', error)
        this.message = '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #ffffff;
}
.login-box {
  width: 400px;
  text-align: center;
}
.logo {
  font-size: 32px;
  font-weight: bold;
  color: #002c5f; /* 현대 블루 */
  margin-bottom: 40px;
}
.input-group {
  margin-bottom: 15px;
}
input {
  width: 100%;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}
.message {
  margin-bottom: 12px;
  color: #d03838;
  font-size: 14px;
  text-align: left;
}
.btn-primary {
  width: 100%;
  padding: 15px;
  background-color: #002c5f;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}
.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
.links {
  margin-top: 20px;
}
.links a {
  color: #666;
  text-decoration: none;
  font-size: 14px;
}
</style>