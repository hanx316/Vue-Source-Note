export const SSR_ATTR = 'data-server-rendered'

export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]

/**
 * 生命周期命名的定义
 */
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch' // 2.6 新增的钩子 参考这个 PR: https://github.com/vuejs/vue/pull/9017
]
