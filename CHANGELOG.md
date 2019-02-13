#### 2019.01.23

- Vue 的入口文件 `src/core/index`, 这里引入 Vue 构造函数，初始化全局 API， SSR 标志挂载，替换版本号
- 梳理了一下配置文件 `src/core/config`
- 梳理了 `src/core/global-api/index`, 这里是全局 API 初始化的主要逻辑
- 梳理了 `src/shared/constants`, 这里定义了一些命名，比如生命周期的各种钩子

疑问：

1. 为什么要定义那些配置？
2. 暴露了一些工具方法在 `Vue.util`, 但又不推荐使用，那为什么要暴露出去？

#### 2019.01.24

- 阅读 `src/shared/util` 中部分方法
- 简单梳理 `src/core/observer/index` 中 Observer 构造器逻辑

疑问：

1. 为什么 `src/shared/util` 中提到 isUndef 等四个方法更好？
2. 为什么 `src/core/util/lang` 中检测字符串开头的方法要用十六进制来比较字符编码？
3. Observer 是用来观测 plain object 或者 array 的，为什么对参数 value 的 Flow 类型检测要设为 any? `src/core/observer/index`

#### 2019.01.25

- `src/core/observe/index` 中的 observe 和 defineReactive 方法

疑问：

1. ~~defineReactive 的后两个参数？~~
2. ~~有一些过去有的判断代码，后来处于什么考虑去掉了？~~

#### 2019.01.29

- 继续看 `src/core/observe/index` 中的 defineReactive 方法

#### 2019.02.12

- 更新代码版本(src/core/observe/index)到 2.6.5, 完善注释内容
- 重点分析 defineReactive 中 getter/setter 的处理
- checkout v2.6.6, 没有修改到目前看到的内容，更新版本到 2.6.6
- 更新 `src/shared/constants`

疑问：

1. 为什么 `dep.notify()` 可以在有 getter 没有 setter 的条件下跳过

#### 2019.02.13

- 更新 `src/core/config`, `src/core/index`, `src/core/global-api/index` 到 2.6.6
