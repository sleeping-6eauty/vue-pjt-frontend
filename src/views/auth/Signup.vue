<template>
  <div class="signup-box">
    <div class="logo">HYUNDAI</div> 

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
        <input type="text" v-model="form.empId" placeholder="사번" required />
      </div>
      
      <button type="submit" class="btn-primary">계정 등록</button>
    </form>
    
    <div class="links">
      <router-link to="/login" class="btn-cancel">취소</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Signup',
  data() {
    return {
      form: {
        name: '',
        email: '',
        password: '',
        empId: ''
      }
    }
  },
  methods: {
    handleSignup() {
      // Springboot API 회원가입 호출 로직 추가 부분
      console.log('계정 등록 데이터:', this.form);
      alert('등록이 요청되었습니다. 관리자 승인 후 로그인 가능합니다.');
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
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
  margin-top: 20px;
}

.btn-primary:hover {
  background-color: #001f42;
}

.links {
  margin-top: 20px;
}

.btn-cancel {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
}
</style>