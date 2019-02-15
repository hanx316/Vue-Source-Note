/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
// 拷贝了一份 Array.prototype 来重写方法，避免干扰原来的 Array.prototype
// arrayMethods.__proto__ === Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 要重写的方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  // 缓存原方法
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    // 调用原方法拿到结果，最终再返回
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    // push, unshift, splice 都是插入数组元素的操作
    // inserted 拿到插入的元素或者元素集合
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 插入的元素需要调用观测数组的方法完成观测
    // 实际上只有新插入的元素才是需要新进行观测的
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 通知依赖更新
    ob.dep.notify()
    return result
  })
})
