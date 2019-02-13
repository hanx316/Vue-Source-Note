/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,                  // core/util/lang
  warn,
  hasOwn,               // shared/util
  hasProto,
  isObject,             // shared/util
  isPlainObject,        // shared/util
  isPrimitive,          // 2.6.x 新引入的
  isUndef,              // 2.6.x 新引入的
  isValidArrayIndex,    // shared/util
  isServerRendering     // core/util/env
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 * 有些情况下，我们可能希望能够在组件更新计算时禁用观测，所以设置了一个标志
 * 这里对于之前看的 2.5.9 版本的代码有一定变动，下面是老版本的注释:
 *
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 *
 * 默认情况下，当设置了一个响应式属性，新的值会被转化为响应式的
 * 然而当传递 props 时，并不希望发生这种强制转换，因为也许传递的是一个冻结对象下的嵌套值
 * 强制转换会破坏冻结的设计
 *
 * es 的 const 如果声明引用类型的值，引用地址不能改变，但是其中存储的值依然可以改变
 * 有讨论说认为 const 作为常量声明，就算引用类型，也应该保持内部的值不变
 * 但从 vue 这样使用看来，大可不必做这样的坚持，本身就是语言规范赋予的不算糟粕的特性，可以利用起来
 *
 * observerState 会 export 出去供外部修改 shouldConvert
 * 提供一个标志来控制这种 observe 的发生依然是有必要的，比如避免重复 observe
 *
 * ```
 * export const observerState = {
 *   shouldConvert: true
 * }
 * ```
 *
 * 这里将原来的 const 声明的对象替换为了 let 声明的 boolean
 * 新增了一个改变 shouldObserve 的方法 toggleObserving
 * 这个变更的发布是在 v2.5.14
 * 参考这个 commit
 * https://github.com/vuejs/vue/commit/a2cd412876c68ff0fac8e70c82676684c6f82770#diff-e796a5bf086735147979ef0b70a21a9c
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  /**
   * Observer 实例上三个属性：
   * 1. value: 观测的数据对象
   * 2. dep: 依赖收集容器对象
   * 3. vmCount: 观测数据对象作为根数据的 Vue 实例数量，初始化为 0
   * Observer 两个原型方法
   * 1. walk 遍历对象 key 设置属性变化响应
   * 2. observeArray 观测数组
   */
  // Observer 是用来观测 plain object 或者 array 的，为什么这里 Flow 的类型要设为 any?
  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    // __ob__ 绑定所观测数据对象的观察者, Observer 的实例引用
    // __ob__ 的属性 def 时设置不可枚举
    // value.__ob__.value === value 这里有一个循环引用
    def(value, '__ob__', this)
    // 处理数组
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      // 纯对象则直接遍历对象的 key 添加 getter/setter
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * 遍历对象的 key 添加 getter/setter
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   * 观测数组元素
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * 创建 Observer 实例
 * 如果成功创建则返回实例
 * 如果已有实例则返回当前实例
 * 通过 __ob__ 来判断
 *
 * observe 方法第一个参数 value 是需要观测的对象或数组
 * 从使用 isObject 来进行条件判断可以明白这里逻辑前提就是 value 应该是 a JSON-compliant type
 *
 * 第二个可选参数 asRootData, 是否作为根数据的标志
 *
 * 返回值是 Observer 实例或者 undefined
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // isObject 的使用是有预设场景的
  // 简单判断 value 不是对象或者是 VNode 实例就返回（依然返回 undefined）
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    /**
     * new Observer 调用的几个条件
     * 1. 可观测标志是 true
     * 2. 不是服务端渲染，具体参考：服务器上的数据响应
     * https://ssr.vuejs.org/zh/guide/universal.html#%E6%9C%8D%E5%8A%A1%E5%99%A8%E4%B8%8A%E7%9A%84%E6%95%B0%E6%8D%AE%E5%93%8D%E5%BA%94
     * 3. 在预设引用类型的基础上再确定是 array || plain object
     * 4. 对象或数组可以被扩展属性
     * 5. 不是 Vue 实例
     */
    // 参考上面 shouldObserve 的声明注释
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    // Object.isExtensible 检查对象是否可以添加属性
    // Object.preventExtensions, Object.freeze 以及 Object.seal 这三个方法可以让对象不可扩展
    Object.isExtensible(value) &&
    // core/instance/init 中可以看到所有 vue 实例都设置了 _isVue 为 true
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  // 每一次 observe 调用，如果是根数据就递增数据绑定的 vue 实例数量
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 定义一个对象上的响应式属性，主要是添加 getter/setter
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,       // 自定义 setter
  shallow?: boolean               // 默认是深度观测，为 true 时为浅观测（即不考虑对象嵌套）
) {
  // 依赖收集对象
  const dep = new Dep()

  // Object.getOwnPropertyDescriptor 获取属性描述符
  // 严谨的边界判断
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 对象可能已经存在 getter/setter, 所以提取出来，在下面的 get/set 中先调用，避免覆盖和丢失原来的操作
  const getter = property && property.get
  const setter = property && property.set
  /**
   * 这里会产生四种情况
   * A: getter setter 都有
   * B: getter setter 都没有
   * C: 有 getter 没有 setter
   * D: 没有 getter 有 setter
   */
  /**
   * 下面的判断 (!getter || setter) 包括了以上 ABD 三种情况
   * arguments.length === 2 说明没有传递第三个参数 val
   * 以上两个条件必须同时满足，表示必须是没有传入 val 的时候才去对 val 赋值
   * 所以如果要考虑 val 赋值的话，当且仅当只有 getter 的时候，才跳过赋值
   * 这里的判断变更过几次，最初是则是完全没有，可以参考这个 PR
   * https://github.com/vuejs/vue/pull/7302
   * walk 的实现中是这样调用的 defineReactive(obj, keys[i])，并没有传入 val，而是在这里来对 val 赋值
   * 为什么这样做，参考：保证定义响应式数据行为的一致性 http://hcysun.me/vue-design/art/7vue-reactive.html

   * 以下是我的理解：
   * 简单说，显式声明的对象是没有 get/set 方法的，但是通过 Object.defineProperty 可以让一个对象的属性存在上面 ABCD 四种情况
   * 那么我们需要考虑，如果 defineReactive 传入了 val, 即原来 walk 中这样调用 defineReactive(obj, keys[i], obj[keys[i]])
   * 在面对 ABCD 四种情况出现时会发生什么事？
   * 情况 AC 存在 getter, 在传入 obj[keys[i]] 时就会先调用一次 getter，与下面的 value 的声明处重复调用了
   * 所以那个 PR 去除了 walk 中 defineReactive 传入的 val，而在这里进行判断，如果不存在 getter 才赋值一次，反正最终的 value 是下面决定的
   * 看上去很美好，但是对于存在 getter 的情况这里就漏了赋值, val 就是 undefined
   * 这样一来, 再下一行先调用的 observe(val) 传入的就是 undefined, 如果数据是嵌套的对象或数组，就不会再按照预期进行观测，根据讨论看来这被认为是合理的情况
   * 也就是说，基于上面的讨论，如果一个属性已经存在 getter, 那么不应该再深度观测，避免用户在 getter 中搞骚操作
   * 但是这样又产生了新的问题， defineReactive 为 val 添加了 get/set 方法
   * 如果对原本不会深度观测的数据重新赋值，会触发 setter 继而调用 observe(newVal)，而 newVal 不会是 undefined
   * 如果 newVal 正好又是一个嵌套的对象或者数组，这样原本不会深度观测的数据在经过一次赋值之后又变成了深度观测的数据，产生了不一致的情况
   * 这个 PR 进行了部分修正: https://github.com/vuejs/vue/pull/7828
   * 这样只有当情况 C, 只存在 getter 时才会跳过赋值（不会事先对嵌套数据进行深度观测），意味着如果存在 setter 那么无论如何都会深度观测
   * 原本不会深度观测的情况 AC 又去掉了 A, 原本要规避的问题其实又出现了漏洞
   * 绕了这么大一圈，都是最开始那个糟糕的 PR 的锅，而他本来在 getter 中做很多额外操作导致重复调用开销变大的问题个人认为本来就不是一个好的设计
   * 再者，从 defineReactive 的参数设计上 val 就不是选择传入的，这里改了一堆，让 defineReactive 的调用出现了分支情况，让问题变得更复杂
   * 以上是下面这个 if 条件的来龙去脉
   */
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
  /**
   * 这里对是否深度观测进行了判断，默认会开启深度观测, childOb === val.__ob__
   * 如果 val 是个对象或数组，那么通过 observe 的调用, new Observer 的调用，最终形成 defineReactive 的递归
   * 如果 val 只是原始值类型，那么 observe 会直接 return undefined
   * 这一步，解决了 val 如果为对象或数组，它的子孙元素的观测问题
   */
  let childOb = !shallow && observe(val)

  // 这一步，才是解决观测 val 本身的问题
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 对已经存在的 getter 的处理
      const value = getter ? getter.call(obj) : val
      // 处理依赖
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      // 对已经存在的 getter 的处理，在 setter 中依然要处理 getter
      const value = getter ? getter.call(obj) : val

      /* eslint-disable no-self-compare */
      // newVal !== newVal && value !== value js 中可能出现自身和自身不等的值是 NaN
      // 所以如果两个值不严格相等，那么存在两种可能：
      // 1. 两个值确实不等
      // 2. 两个值都是 NaN
      // 在两个值不等的前提下，如果新旧的 val 都和自身不等，说明新旧值是 NaN, 那么 return
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */

      /**
       * 如果传入了自定义 setter 则调用，但是前提是非生产模式
       * 从这里逻辑看出来, customSetter 和 setter 本来要处理的逻辑并非冲突，而是额外新增的
       * 并且屏蔽了生产模式，应该是一个开发模式下起辅助作用的东西
       */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        // 如果有 setter 就直接调用 setter 来修改 newVal
        setter.call(obj, newVal)
      } else {
        /**
         * 如果没有 setter 就手动修改 val
         * 但是从上面看来，如果存在 getter, get 返回的值是从 getter 来的，而非 val
         * 所以如果有 getter 的属性，这一步执行与否都无所谓
         * 所以对于 getter && !setter 即情况 C, 由于本来也不必对原始数据进行深度观测，observe(newVal) 也就不必要了
         * 至于 dep.notify() 为什么也可以不用，先留个坑，看到 dep 的时候再填
         * 所以前面有一行提前 return 的操作
         */
        val = newVal
      }
      // 处理新的值是对象或数组的情况
      childOb = !shallow && observe(newVal)
      // 订阅依赖
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
