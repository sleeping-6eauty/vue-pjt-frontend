<template>
  <div class="permission-page">
    <h2>이용자 목록</h2>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="loading" class="loading">로딩 중...</div>

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
        <option value="employee_id">사번</option>
      </select>
      <input type="text" v-model="searchKeyword" placeholder="검색 내용" />
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>사번</th>
          <th>이름</th>
          <th>이메일</th>
          <th>역할</th>
          <th v-if="currentTab === 'all'">상태</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>{{ user.employee_id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>

          <td v-if="currentTab === 'all'">
            <select v-model="user.role" class="role-select" @change="handleRoleChange(user.id, user.role)">
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
            <select v-model="user.status" class="status-select" @change="handleStatusChange(user.id, user.status)">
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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default {
  name: 'PermissionForm',
  data() {
    return {
      currentTab: 'all',
      searchType: 'name',
      searchKeyword: '',
      users: [],
      loading: false,
      error: null
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
          user[this.searchType].toLowerCase().includes(this.searchKeyword.toLowerCase())
        );
      }
      return result;
    }
  },
  async mounted() {
    await this.loadUsers();
  },
  methods: {
    async loadUsers() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('사용자 목록을 불러오는데 실패했습니다.');
        }

        const result = await response.json();
        this.users = result.map(user => ({
          id: user.employeeId,
          employee_id: user.employeeId.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }));
      } catch (error) {
        console.error('Load users error:', error);
        this.error = error.message;
        // 임시 데이터로 폴백
        this.users = [
          { id: 1, employee_id: 'aisj192891910', name: '홍길동', email: 'djfkdjkf@hyundai.com', role: 'User', status: 'Pending' },
          { id: 2, employee_id: 'aisj192891911', name: '김철수', email: 'chulsoo@hyundai.com', role: 'User', status: 'Deleted' },
          { id: 3, employee_id: 'aisj192891912', name: '이영희', email: 'younghee@hyundai.com', role: 'Admin', status: 'Active' },
        ];
      } finally {
        this.loading = false;
      }
    },

    async updateUserRole(userId, newRole) {
      try {
        const url = `${API_BASE_URL}/api/users/${userId}/role`
        console.log('Update role API URL:', url, 'role:', newRole)
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        });

        console.log('Update role response status:', response.status)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Update role response error:', errorText)
          throw new Error(`역할 업데이트에 실패했습니다. (${response.status})`);
        }

        const result = await response.json()
        console.log('Update role success:', result)
        return result;
      } catch (error) {
        console.error('Update role error:', error);
        throw error; // 상위로 에러 전파
      }
    },

    async handleAction(action, userId) {
      if (!confirm(`${action} 처리 하시겠습니까?`)) return;

      try {
        let endpoint, method, body;

        switch (action) {
          case 'approve':
            endpoint = `${API_BASE_URL}/api/users/${userId}/approve`;
            method = 'PUT';
            break;
          case 'reject':
            endpoint = `${API_BASE_URL}/api/users/${userId}`;
            method = 'DELETE';
            break;
          case 'cancelDelete':
            endpoint = `${API_BASE_URL}/api/users/${userId}/cancel-delete`;
            method = 'PUT';
            break;
          case 'confirmDelete':
            endpoint = `${API_BASE_URL}/api/users/${userId}`;
            method = 'DELETE';
            break;
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
          throw new Error(`${action} 처리에 실패했습니다.`);
        }

        // 성공 시 목록 새로고침
        await this.loadUsers();
      } catch (error) {
        console.error('Action error:', error);
        alert(error.message);
      }
    },

    async handleRoleChange(userId, newRole) {
      console.log('handleRoleChange:', userId, newRole)

      // Optimistic update: UI 먼저 업데이트
      const userIndex = this.users.findIndex(u => u.id === userId);
      const oldRole = this.users[userIndex].role;
      this.users[userIndex].role = newRole;

      // 백그라운드에서 API 호출
      try {
        await this.updateUserRole(userId, newRole);
      } catch (error) {
        // 실패 시 원래 값으로 롤백
        this.users[userIndex].role = oldRole;
        console.error('Role change failed, rolled back:', error);
        alert('역할 변경에 실패했습니다.');
      }
    },

    async handleStatusChange(userId, newStatus) {
      console.log('handleStatusChange:', userId, newStatus)

      // Optimistic update: UI 먼저 업데이트
      const userIndex = this.users.findIndex(u => u.id === userId);
      const oldStatus = this.users[userIndex].status;
      this.users[userIndex].status = newStatus;

      // 백그라운드에서 API 호출
      try {
        await this.updateUserStatus(userId, newStatus);
      } catch (error) {
        // 실패 시 원래 값으로 롤백
        this.users[userIndex].status = oldStatus;
        console.error('Status change failed, rolled back:', error);
        alert('상태 변경에 실패했습니다.');
      }
    }
  },
  watch: {
    // 역할이나 상태가 변경되면 자동으로 DB 업데이트
    users: {
      handler(newUsers) {
        // watch는 초기 로드 시에도 실행되므로, mounted 후에만 처리
        if (!this.loading && newUsers.length > 0) {
          // 실제로는 각 필드의 변경을 감지하는 로직이 필요하지만,
          // 간단하게 하기 위해 select의 @change 이벤트로 처리
        }
      },
      deep: true
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

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
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
