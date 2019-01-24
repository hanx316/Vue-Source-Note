/* @flow */

/**
 * 就是把 util 目录下的文件统一 export，注意没有 util/perf
 * 外部就可以通过 util/index 来 import 对应的方法名，统一了路径
 * 还可以在 index 文件中额外添加或者导出其他内容，例如 defineReactive, shared/util
 */
export * from 'shared/util'
export * from './lang'
export * from './env'
export * from './options'
export * from './debug'
export * from './props'
export * from './error'
export * from './next-tick'
export { defineReactive } from '../observer/index'
