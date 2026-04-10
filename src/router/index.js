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
      { path: 'permission', name: 'Permission', component: () => import('@/views/admin/Permission.vue') },
      // BOM 조회, 자재 관리 등 추가 예정
      { path: 'order', name: 'Order', component: () => import('@/views/Order.vue') },
      { path: 'bom', name: 'Bom', component: () => import('@/views/BOM.vue') },
      { path: 'material', name: 'Material', component: () => import('@/views/Material.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router