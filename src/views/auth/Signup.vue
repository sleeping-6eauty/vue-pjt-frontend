<template>
  <div class="login-container">
    <div class="signup-box">
      <img src="@/assets/images/logo.png" style="width: 103px; height: 62px; margin-bottom: 30px;" alt="Logo" class="logo-image" />

      <form @submit.prevent="handleSignup">
        <div class="input-group">
          <input type="text" v-model="form.name" placeholder="이름" required />
        </div>
        <div class="input-group">
          <input type="email" v-model="form.email" placeholder="이메일" required />
        </div>
        <div class="input-group">
          <input type="password" v-model="form.password" placeholder="비밀번호" required />
        </div>
        <div class="input-group">
          <input type="number" v-model="form.employee_id" placeholder="사번" required />
        </div>
        <div v-if="message" class="message">{{ message }}</div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '회원가입 중...' : '회원가입' }}
        </button>
      </form>

      <div class="links">
        <router-link to="/login">취소</router-link>
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default {
  name: 'SignupForm',
  data() {
    return {
      form: {
        name: '',
        email: '',
        password: '',
        employee_id: ''
      },
      message: '',
      loading: false
    }
  },
  methods: {
    async handleSignup() {
      this.message = ''
      this.loading = true

      const employeeId = Number(this.form.employee_id)
      if (!employeeId || employeeId <= 0) {
        this.message = '유효한 사번을 입력해주세요.'
        return
      }

      const signupData = {
        employeeId,
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        password: this.form.password
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(signupData)
        })

        const result = await response.json()

        if (response.ok) {
          alert(result.message || '회원가입 성공')
          this.$router.push('/login')
        } else {
          this.message = result.message || '회원가입에 실패했습니다.'
        }
      } catch (error) {
        console.error('Signup API error:', error)
        this.message = '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
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
.signup-box {
  width: 400px;
  text-align: center;
  background: #ffffff;
  padding: 40px;
}

.logo {
  font-size: 32px;
  font-weight: bold;
  color: #002c5f;
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
  outline: none;
}

input:focus {
  border-color: #002c5f;
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

  .message {
    margin-top: 12px;
    color: #d03838;
    font-size: 14px;
    text-align: left;
  }

.btn-cancel {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
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
