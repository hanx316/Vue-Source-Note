/* @flow */

/**
 * Check if a string starts with $ or _
 * 检查以 $ 或者 _ 开头的字符串
 */
export function isReserved (str: string): boolean {
  const c = (str + '').charCodeAt(0) // + '' 转一下类型
  // 为什么使用十六进制呢？？？
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.
 * 对 Object.defineProperty 的简单封装，免得每次写一堆
 */
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable, // undefined => false
    writable: true,
    configurable: true
  })
}

/**
 * Parse simple path.
 */
const bailRE = /[^\w.$]/
export function parsePath (path: string): any {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}
