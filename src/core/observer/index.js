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
  isValidArrayIndex,    // shared/util
  isServerRendering     // core/util/env
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */
/**
 * 默认情况下，当设置了一个响应式属性，新的值会被转化为响应式的
 * 然而当传递 props 时，并不希望发生这种强制转换，因为也许传递的是一个冻结对象下的嵌套值
 * 强制转换会破坏冻结的设计
 *
 * es 的 const 如果声明引用类型的值，引用地址不能改变，但是其中存储的值依然可以改变
 * 有讨论说认为 const 作为常量声明，就算引用类型，也应该保持内部的值不变
 * 但从 vue 这样使用看来，大可不必做这样的坚持，本身就是语言规范赋予的不算糟粕的特性，可以利用起来
 *
 * observerState 会 export 出去供外部修改 shouldConvert，提供一个标志来控制这种 observe 的发生依然是有必要的，比如避免重复 observe
 */
export const observerState = {
  shouldConvert: true
  // isSettingProps: false 过往版本还有这个属性，不知道什么时候，出于什么考虑去掉了
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that has this object as root $data

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
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * 遍历对象的 key 添加 getter/setter
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // defineReactive(obj, key, value)
      defineReactive(obj, keys[i], obj[keys[i]])
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
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object, keys: any) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
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
 */
/**
 * 创建 Observer 实例
 * 如果成功创建则返回实例
 * 如果已有实例则返回当前实例
 * 通过 __ob__ 来判断
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // isObject 的使用是有预设场景的
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    // Object.isExtensible 检查对象是否可以添加属性
    // 在预设的基础上再确定是 array || plain object
    observerState.shouldConvert && // 参考上面 observerState 的声明注释
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue // 非 vue 实例 core/instance/init 所有 vue 实例都设置了 _isVue 为 true
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
  // 市面上讲解的 2.5.x 的代码还有下面这段，后来又去掉了，未知原因
  // if (!getter && arguments.length === 2) {
  //   val = obj[key]
  // }

  // 这里对是否深度观测进行了判断，默认会开启深度观测, childOb === val.__ob__
  // 如果 val 是个对象或数组，那么通过 observe 的调用, new Observer 的调用，最终形成 defineReactive 的递归
  // 如果 val 只是原始值类型，那么 observe 会直接 return
  // 这一步，解决了 val 如果为对象或数组，它的子孙元素的观测问题
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
      // 对已经存在的 setter 的处理
      if (setter) {
        setter.call(obj, newVal)
      } else {
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
