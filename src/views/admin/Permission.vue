<template>
  <div class="permission-page">
    <h2>이용자 목록</h2>
    
    <div class="tabs">
      <button :class="{ active: currentTab === 'all' }" @click="currentTab = 'all'">
        전체
      </button>
      <button :class="{ active: currentTab === 'pending' }" @click="currentTab = 'pending'">
        등록 대기 <span v-if="hasPendingUsers" class="red-dot"></span>
      </button>
      <button :class="{ active: currentTab === 'deleted' }" @click="currentTab = 'deleted'">
        삭제 대기 <span v-if="hasDeletedUsers" class="red-dot"></span>
      </button>
    </div>

    <div class="search-bar">
      <select v-model="searchType">
        <option value="name">이름</option>
        <option value="empId">사번</option>
      </select>
      <input type="text" v-model="searchKeyword" placeholder="검색 내용" />
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>사번</th>
          <th>이름</th>
          <th>이메일</th>
          <th>역할/액션</th>
          <th v-if="currentTab === 'all'">상태</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>{{ user.empId }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          
          <td v-if="currentTab === 'all'">
            <select v-model="user.role" class="role-select">
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </td>
          <td v-else class="action-buttons">
            <button v-if="currentTab === 'pending'" class="btn-approve" @click="handleAction('approve', user.id)">승인</button>
            <button v-if="currentTab === 'pending'" class="btn-reject" @click="handleAction('reject', user.id)">거절</button>
            
            <button v-if="currentTab === 'deleted'" class="btn-cancel" @click="handleAction('cancelDelete', user.id)">취소</button>
            <button v-if="currentTab === 'deleted'" class="btn-reject" @click="handleAction('confirmDelete', user.id)">삭제</button>
          </td>

          <td v-if="currentTab === 'all'">
            <select v-model="user.status" class="status-select">
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Deleted">Deleted</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Permission',
  data() {
    return {
      currentTab: 'all', 
      searchType: 'name',
      searchKeyword: '',
      users: [
        { id: 1, empId: 'aisj192891910', name: '홍길동', email: 'djfkdjkf@hyundai.com', role: 'User', status: 'Pending' },
        { id: 2, empId: 'aisj192891911', name: '김철수', email: 'chulsoo@hyundai.com', role: 'User', status: 'Deleted' },
        { id: 3, empId: 'aisj192891912', name: '이영희', email: 'younghee@hyundai.com', role: 'Admin', status: 'Active' },
      ]
    }
  },
  computed: {
    // 등록 대기 상태인 유저가 1명 이상 있는지 확인
    hasPendingUsers() {
      return this.users.some(user => user.status === 'Pending');
    },
    // 삭제 대기 상태인 유저가 1명 이상 있는지 확인
    hasDeletedUsers() {
      return this.users.some(user => user.status === 'Deleted');
    },
    filteredUsers() {
      let result = this.users.filter(user => {
        if (this.currentTab === 'pending') return user.status === 'Pending';
        if (this.currentTab === 'deleted') return user.status === 'Deleted';
        return true; 
      });

      if (this.searchKeyword) {
        result = result.filter(user => 
          user[this.searchType].includes(this.searchKeyword)
        );
      }
      return result;
    }
  },
  methods: {
    handleAction(action, userId) {
      if (confirm(`${action} 처리 하시겠습니까?`)) {
        // 처리 후 상태 변경 로직 (예시)
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (action === 'approve') {
          this.users[userIndex].status = 'Active';
        } else if (action === 'reject' && this.currentTab === 'pending') {
          this.users.splice(userIndex, 1); // 목록에서 제거
        }
        // 이 부분에 API 요청 로직이 들어가면 자연스럽게 computed가 반응하여 빨간 점이 사라집니다.
      }
    }
  }
}
</script>

<style scoped>
/* 기존 스타일 유지 */
.permission-page {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  background-color: #f1f3f5;
  padding: 10px;
  border-radius: 30px;
  width: fit-content;
  margin: 0 auto 20px auto;
}

.tabs button {
  position: relative; /* 자식 요소 절대 위치 배치를 위해 추가 */
  padding: 10px 30px;
  border: none;
  background: transparent;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabs button.active {
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  color: #000;
}

/* 새로 추가된 빨간 알림 점 스타일 */
.red-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #ff4d4f; /* 알림용 레드 컬러 */
  border-radius: 50%;
  margin-left: 6px;
  margin-bottom: 8px; /* 글자 우측 상단으로 살짝 올리기 */
}

/* 이하 기존 테이블 및 버튼 스타일 유지 */
.search-bar { display: flex; gap: 10px; margin-bottom: 20px; background: #f1f3f5; padding: 10px; border-radius: 10px; }
.search-bar select, .search-bar input { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
.search-bar input { flex: 1; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 15px; text-align: center; border-bottom: 1px solid #eee; }
.data-table th { background-color: #f8f9fa; font-weight: bold; color: #333; }
.role-select, .status-select { padding: 5px 10px; border-radius: 5px; border: 1px solid #ccc; }
.action-buttons button { padding: 5px 15px; border: none; border-radius: 5px; color: white; cursor: pointer; margin: 0 3px; }
.btn-approve { background-color: #17a2b8; }
.btn-reject { background-color: #dc3545; }
.btn-cancel { background-color: #17a2b8; }
</style>