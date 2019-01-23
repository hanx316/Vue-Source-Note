import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'

/**
 * 初始化全局 API
 */
initGlobalAPI(Vue)

/**
 * 下面注册了两个属性在 Vue 构造函数的原型上，一个作为 SSR 的 flag，一个作为 SSR 的上下文
 * 可以先略过
 */
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

/**
 * Vue 的版本号， Release Build 的时候进行替换
 * 来源应该在 build/config.js `const version = process.env.VERSION || require('../package.json').version`
 */
Vue.version = '__VERSION__'

export default Vue
