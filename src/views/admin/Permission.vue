<template>
  <div class="permission-page">
    <h2>이용자 목록</h2>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="loading" class="loading">로딩 중...</div>

    <div class="tabs">
      <button :class="{ active: currentTab === 'all' }" @click="changeTab('all')">
        전체
      </button>
      <button :class="{ active: currentTab === 'pending' }" @click="changeTab('pending')">
        등록 대기 <span v-if="hasPendingUsers" class="red-dot"></span>
      </button>
      <button :class="{ active: currentTab === 'deleted' }" @click="changeTab('deleted')">
        삭제 대기 <span v-if="hasDeletedUsers" class="red-dot"></span>
      </button>
    </div>

    <div class="search-bar">
      <select v-model="searchType">
        <option value="name">이름</option>
        <option value="employee_id">사번</option>
      </select>
      <input
        type="text"
        v-model="searchKeyword"
        placeholder="검색 내용"
        @keyup.enter="handleSearch"
      />
      <button type="button" class="btn-search" @click="handleSearch">검색</button>
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
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.employee_id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>

          <td v-if="currentTab === 'all'">
            <select
              v-model="user.role"
              class="role-select"
              @change="handleRoleChange(user.id, user.role)"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </td>

          <td v-else class="action-buttons">
            <button
              v-if="currentTab === 'pending'"
              class="btn-approve"
              @click="handleAction('approve', user.id)"
            >
              승인
            </button>
            <button
              v-if="currentTab === 'pending'"
              class="btn-reject"
              @click="handleAction('reject', user.id)"
            >
              거절
            </button>

            <button
              v-if="currentTab === 'deleted'"
              class="btn-cancel"
              @click="handleAction('cancelDelete', user.id)"
            >
              취소
            </button>
            <button
              v-if="currentTab === 'deleted'"
              class="btn-reject"
              @click="handleAction('confirmDelete', user.id)"
            >
              삭제
            </button>
          </td>

          <td v-if="currentTab === 'all'">
            <select
              v-model="user.status"
              class="status-select"
              @change="handleStatusChange(user.id, user.status)"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Deleted">Deleted</option>
            </select>
          </td>
        </tr>

        <tr v-if="!loading && users.length === 0">
          <td :colspan="currentTab === 'all' ? 5 : 4" class="empty-row">
            조회된 사용자가 없습니다.
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination" v-if="totalPages > 1">
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
        이전
      </button>

      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>

      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        다음
      </button>
    </div>
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
      error: null,
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      totalCount: 0,
      hasPendingUsers: false,
      hasDeletedUsers: false
    }
  },
  async mounted() {
    await this.loadUsers()
  },
  methods: {
    getStatusParam() {
      if (this.currentTab === 'pending') return 'Pending'
      if (this.currentTab === 'deleted') return 'Deleted'
      return 'all'
    },

    async loadUsers() {
      this.loading = true
      this.error = null


      try {
        const params = new URLSearchParams({
          page: String(this.currentPage),
          size: String(this.pageSize),
          status: this.getStatusParam(),
          searchType: this.searchType,
          keyword: this.searchKeyword
        })

        const response = await fetch(`${API_BASE_URL}/api/users?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('사용자 목록을 불러오는데 실패했습니다.')
        }

        const result = await response.json()

        this.users = (result.users || []).map(user => ({
          id: user.employeeId,
          employee_id: String(user.employeeId),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }))
        this.hasPendingUsers = result.hasPendingUsers ?? false
        this.hasDeletedUsers = result.hasDeletedUsers ?? false
        this.totalCount = result.totalCount ?? 0
        this.totalPages = result.totalPages ?? 1
      } catch (error) {
        console.error('Load users error:', error)
        this.error = error.message
        this.users = []
        this.totalCount = 0
        this.totalPages = 1
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.currentPage = 1
      this.loadUsers()
    },

    changeTab(tab) {
      this.currentTab = tab
      this.currentPage = 1
      this.loadUsers()
    },

    async goToPage(page) {
      if (page < 1 || page > this.totalPages) return
      this.currentPage = page
      await this.loadUsers()
    },

    async updateUserRole(userId, newRole) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Update role response error:', errorText)
          throw new Error(`역할 업데이트에 실패했습니다. (${response.status})`)
        }

        return await response.json()
      } catch (error) {
        console.error('Update role error:', error)
        throw error
      }
    },

    async updateUserStatus(userId, newStatus) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Update status response error:', errorText)
          throw new Error(`상태 업데이트에 실패했습니다. (${response.status})`)
        }

        return await response.json()
      } catch (error) {
        console.error('Update status error:', error)
        throw error
      }
    },

    async handleAction(action, userId) {
      if (!confirm(`${action} 처리 하시겠습니까?`)) return

      try {
        let endpoint = ''
        let method = ''

        switch (action) {
          case 'approve':
            endpoint = `${API_BASE_URL}/api/users/${userId}/approve`
            method = 'PUT'
            break
          case 'reject':
            endpoint = `${API_BASE_URL}/api/users/${userId}`
            method = 'DELETE'
            break
          case 'cancelDelete':
            endpoint = `${API_BASE_URL}/api/users/${userId}/cancel-delete`
            method = 'PUT'
            break
          case 'confirmDelete':
            endpoint = `${API_BASE_URL}/api/users/${userId}`
            method = 'DELETE'
            break
          default:
            throw new Error('알 수 없는 작업입니다.')
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`${action} 처리에 실패했습니다.`)
        }

        await this.loadUsers()
      } catch (error) {
        console.error('Action error:', error)
        alert(error.message)
      }
    },

    async handleRoleChange(userId, newRole) {
      const userIndex = this.users.findIndex(u => u.id === userId)
      if (userIndex === -1) return

      const oldRole = this.users[userIndex].role
      this.users[userIndex].role = newRole

      try {
        await this.updateUserRole(userId, newRole)
        await this.loadUsers()
      } catch (error) {
        this.users[userIndex].role = oldRole
        console.error('Role change failed, rolled back:', error)
        alert('역할 변경에 실패했습니다.')
      }
    },

    async handleStatusChange(userId, newStatus) {
      const userIndex = this.users.findIndex(u => u.id === userId)
      if (userIndex === -1) return

      const oldStatus = this.users[userIndex].status
      this.users[userIndex].status = newStatus

      try {
        await this.updateUserStatus(userId, newStatus)
        await this.loadUsers()
      } catch (error) {
        this.users[userIndex].status = oldStatus
        console.error('Status change failed, rolled back:', error)
        alert('상태 변경에 실패했습니다.')
      }
    }
  }
}
</script>

<style scoped>
.permission-page {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
  position: relative;
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  color: #000;
}

.red-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #ff4d4f;
  border-radius: 50%;
  margin-left: 6px;
  margin-bottom: 8px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: #f1f3f5;
  padding: 10px;
  border-radius: 10px;
}

.search-bar select,
.search-bar input,
.btn-search {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.search-bar input {
  flex: 1;
}

.btn-search {
  background-color: #002c5f;
  color: white;
  border: none;
  cursor: pointer;
  min-width: 72px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.role-select,
.status-select {
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.action-buttons button {
  padding: 5px 15px;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  margin: 0 3px;
}

.btn-approve {
  background-color: #17a2b8;
}

.btn-reject {
  background-color: #dc3545;
}

.btn-cancel {
  background-color: #17a2b8;
}

.empty-row {
  color: #666;
  padding: 24px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background-color: #002c5f;
  color: white;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: #333;
}
</style>
