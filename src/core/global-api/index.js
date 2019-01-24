/* @flow */

/**
 * global-api 目录下的其他文件都在这里引入并初始化
 */
import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'

import {
  warn,           // core/util/debug
  extend,         // shared/util
  nextTick,       // core/util/next-tick
  mergeOptions,   // core/util/options
  defineReactive  // core/util/index => observer/index
} from '../util/index'

/**
 * 初始化 Vue 全局 API
 * @param {GlobalAPI} Vue - Vue 构造函数
 */
export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  // 通过 Vue.config 获取预定义的配置，不允许 set
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // Vue 暴露了一些工具方法，但并不推荐使用, why?
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // 全局的 set, delete, nextTick 方法
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  /**
   * 初始化 Vue 的默认 option
   */
  Vue.options = Object.create(null)
  // filter, component, directive 专门定义了命名
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // Vue.options._base 挂载了最初的 Vue 构造函数
  Vue.options._base = Vue

  // 注册 Vue 内置组件，单独 Vue 内置的组件只有 Keep-Alive
  extend(Vue.options.components, builtInComponents)

  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  initAssetRegisters(Vue)
}
