import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: 'login', name: 'Login', component: () => import('@/views/auth/Login.vue') },
      { path: 'signup', name: 'Signup', component: () => import('@/views/auth/Signup.vue') }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    // 추후 네비게이션 가드(beforeEach)로 어드민 권한 체크 로직 추가 필요
    children: [
      { path: 'permission', name: 'Permission', component: () => import('@/views/admin/Permission.vue') }
      // BOM 조회, 자재 관리 등 추가 예정
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router