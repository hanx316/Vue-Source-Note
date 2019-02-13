/* @flow */

import {
  no,       // always return false
  noop,     // 空函数
  identity  // always return param itself
} from 'shared/util'

import { LIFECYCLE_HOOKS } from 'shared/constants'

export type Config = {
  // user
  optionMergeStrategies: { [key: string]: Function };
  silent: boolean;
  productionTip: boolean;
  performance: boolean;
  devtools: boolean;
  errorHandler: ?(err: Error, vm: Component, info: string) => void;
  warnHandler: ?(msg: string, vm: Component, trace: string) => void;
  ignoredElements: Array<string | RegExp>;
  keyCodes: { [key: string]: number | Array<number> };

  // platform
  isReservedTag: (x?: string) => boolean;
  isReservedAttr: (x?: string) => boolean;
  parsePlatformTagName: (x: string) => string;
  isUnknownElement: (x?: string) => boolean;
  getTagNamespace: (x?: string) => string | void;
  mustUseProp: (tag: string, type: ?string, name: string) => boolean;

  // private
  async: boolean;

  // legacy
  _lifecycleHooks: Array<string>;
};

export default ({
  /**
   * 合并策略
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),

  /**
   * 是否打印警告
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * 启动时是否显示生产模式提示信息，生产模式不显示
   * Show production mode tip message on boot?
   */
  productionTip: process.env.NODE_ENV !== 'production',

  /**
   * 是否启用 devtools， 生产模式不启用
   * Whether to enable devtools
   */
  devtools: process.env.NODE_ENV !== 'production',

  /**
   * 是否记录性能表现
   * Whether to record perf
   */
  performance: false,

  /**
   * 错误捕获方法
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * 错误警告方法
   * Warn handler for watcher warns
   */
  warnHandler: null,

  /**
   * 要忽略的元素
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * 用户自定义键盘事件别名
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * 检查 tag 保留字，避免注册组件时和原生 tag 冲突
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * 检查保留属性，避免注册组建 prop 时冲突
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * 检查 tag 是否是未知元素
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * 获取元素命名空间
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * 解析特定平台的 tag
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * 检查 prop 是否必须绑定
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * 主要供 Vue Test Utils 使用，前面提到约定是私有的属性，参见 PR #8240
   * Perform updates asynchronously. Intended to be used by Vue Test Utils
   * This will significantly reduce performance if set to false.
   */
  async: true,

  /**
   * 由于历史遗留因素暴露出生命周期钩子的命名
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
}: Config)
