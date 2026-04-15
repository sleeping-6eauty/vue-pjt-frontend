import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { guestOnly: true }
      },
      {
        path: 'signup',
        name: 'Signup',
        component: () => import('@/views/auth/Signup.vue'),
        meta: { guestOnly: true }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'permission',
        name: 'Permission',
        component: () => import('@/views/admin/Permission.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/views/Order.vue')
      },
      {
        path: 'bom',
        name: 'Bom',
        component: () => import('@/views/bom/BOM.vue')
      },
      {
        path: 'material',
        name: 'Material',
        component: () => import('@/views/material/Material.vue')
      },
      {
        path: 'material/price',
        redirect: '/admin/material'
      },
      {
        path: 'material/history',
        name: 'MaterialHistory',
        component: () => import('@/views/material/MaterialHistory.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.token) {
    authStore.initializeAuth()
  }

  const isAuthenticated = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    return next('/admin/bom')
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return next(isAdmin ? '/admin/permission' : '/admin/bom')
  }

  next()
})

export default router
