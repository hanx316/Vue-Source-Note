/* @flow */

export const emptyObject = Object.freeze({})

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.
// 下面四个方法会产生更好的 JS 引擎机器码，因为更明确，且通过函数的形式？
// 是否未定义
export function isUndef (v: any): boolean %checks {
  return v === undefined || v === null
}

// 是否定义
export function isDef (v: any): boolean %checks {
  return v !== undefined && v !== null
}

// 值是 true
export function isTrue (v: any): boolean %checks {
  return v === true
}

// 值是 false
export function isFalse (v: any): boolean %checks {
  return v === false
}

/**
 * Check if value is primitive
 * 检测是否是原始类型
 */
export function isPrimitive (value: any): boolean %checks {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    // 增加了 symbol 的检测
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * 快速对象检测，用于事先清楚原始值是 json 结构的对象类型
 */
export function isObject (obj: mixed): boolean %checks {
  return obj !== null && typeof obj === 'object'
}

/**
 * Get the raw type string of a value, e.g., [object Object].
 */
const _toString = Object.prototype.toString

/**
 * 通过 Object.prototype.toString 来判断类型
 */
// 拆分了一个 toRawType 方法，slice(8, -1)是固定取值，拿到类似 '[object Object]' 的字符串
export function toRawType (value: any): string {
  return _toString.call(value).slice(8, -1)
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 * JS 纯对象判断
 */
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}

/**
 * 正则对象判断
 */
export function isRegExp (v: any): boolean {
  return _toString.call(v) === '[object RegExp]'
}

/**
 * Check if val is a valid array index.
 * 检测是否是有效的数组下标
 * 这个方法其实也可以用来判断一个值是否是自然数
 */
export function isValidArrayIndex (val: any): boolean {
  /**
   * 这里先用了 parseFloat 为什么不直接用 parseInt?
   * 因为相比 parseInt, parseFloat 有以下好处
   * 1. parseFloat 本身也支持传入整数返回整数，包括了 parseInt 的功能
   * 2. parseFloat 会额外解析第一个.浮点字符 e.g. parseInt('.1') => NaN; parseFloat('.1') => 0.1
   * 3. parseFloat 没有转换基数的参数，对于合法的十六进制字符串永远返回 0
   * 4. parseFloat 可以识别科学计数法表示的字符串而 parseInt 不能
   * 5. parseFloat 可以正确返回 Infinity 和 -Infinity
   */
  // parseFloat 之前先包一层 String 将任意类型的参数都转成了字符串再做 parse, 结果更可控
  const n = parseFloat(String(val))
  // Math.floor(n) === n 可以排除掉浮点数的情况
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

/**
 * promise 检测
 * 只要不是 undefined 或者 null
 * 任意一个值都可以从上面通过 . 运算符来获取属性，因为 js 对原始值的基本包装过程
 * 通过判断 val.then 和 val.catch 这两个方法存在与否简单判断是不是 promise
 */
export function isPromise (val: any): boolean {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}

/**
 * Convert a value to a string that is actually rendered.
 * 将一个值转换为实际渲染的字符串
 * 注意 JSON.stringify 第二三个参数的用法
 * val == null 同样包括 undefined 和 null 两个未定义的情况
 */
export function toString (val: any): string {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 * 将输入的值转为 Number 类型
 * 参数是 string 类型，返回转换后的值, 转换后是 NaN 则返回原字符串本身
 */
export function toNumber (val: string): number | string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}

/**
 * Check if a tag is a built-in tag.
 */
export const isBuiltInTag = makeMap('slot,component', true)

/**
 * Check if an attribute is a reserved attribute.
 */
export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

/**
 * Remove an item from an array
 * 删除数组单个元素
 */
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether the object has the property.
 * 对 Object.prototype.hasOwnProperty 的封装
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}

/**
 * Create a cached version of a pure function.
 * 缓存纯函数
 * 这个方法是一个闭包，内部把纯函数的结果用对象缓存起来，然后返回一个函数，参数是缓存结果的索引
 */
export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }: any)
}

/**
 * Camelize a hyphen-delimited string.
 * abc-abc => abcAbc
 * string.prototype.replace 传函数参数的用法
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

/**
 * Capitalize a string.
 * abc => Abc
 */
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

/**
 * Hyphenate a camelCase string.
 * abcAbcDefHG => abc-abc-def-h-g
 */
const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cached((str: string): string => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})

/**
 * 原本的注释是: Simple bind, faster than native
 * .bind 慢是好几年前的事了
 * 从目前的注释看来，这个方法仅仅用于向下兼容， native bind 已经表现更好了
 * 参考 PR #7491
 * Simple bind polyfill for environments that do not support it,
 * e.g., PhantomJS 1.x. Technically, we don't need this anymore
 * since native bind is now performant enough in most browsers.
 * But removing it would mean breaking code that was able to run in
 * PhantomJS 1.x, so this must be kept for backward compatibility.
 */

/* istanbul ignore next */
function polyfillBind (fn: Function, ctx: Object): Function {
  function boundFn (a) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length
  return boundFn
}

function nativeBind (fn: Function, ctx: Object): Function {
  return fn.bind(ctx)
}

/**
 * 为了不对 bind 的调用大面积修改，这里依然会提供 bind 方法
 * 内部拆分为 polyfillBind 和 nativeBind，只需初始化时一次判断
 */
export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind

/**
 * Convert an Array-like object to a real Array.
 * 将类数组对象转换为真实数组
 */
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

/**
 * Mix properties into target object.
 * 使用 for in 来移植属性，注意会遍历对象继承的可枚举属性
 */
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

/**
 * Merge an Array of Objects into a single Object.
 */
export function toObject (arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
export function noop (a?: any, b?: any, c?: any) {}

/**
 * Always return false.
 */
export const no = (a?: any, b?: any, c?: any) => false

/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 */
export const identity = (_: any) => _

/**
 * Generate a string containing static keys from compiler modules.
 */
export function genStaticKeys (modules: Array<ModuleOptions>): string {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
export function looseEqual (a: any, b: any): boolean {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a)
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every((e, i) => {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 */
export function looseIndexOf (arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}

/**
 * Ensure a function is called only once.
 */
export function once (fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments)
    }
  }
}
