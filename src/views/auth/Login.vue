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
        
        <button type="submit" class="btn-primary">로그인</button>
      </form>
      
      <div class="links">
        <router-link to="/signup">계정 등록</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      form: {
        email: '',
        password: ''
      }
    }
  },
  methods: {
    handleLogin() {
      // API 호출 로직 추가 예정
      console.log('로그인 시도:', this.form);
      // 임시로 권한 관리 페이지로 이동
      this.$router.push('/admin/permission'); 
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
.links {
  margin-top: 20px;
}
.links a {
  color: #666;
  text-decoration: none;
  font-size: 14px;
}
</style>