#### 2019.01.23

- Vue 的入口文件 src/core/index.js，这里引入 Vue 构造函数，初始化全局 API， SSR 标志挂载，替换版本号
- 梳理了一下配置文件 src/core/config.js
- 梳理了 src/core/global-api/index.js， 这里是全局 API 初始化的主要逻辑
- 梳理了 src/shared/constants.js， 这里定义了一些命名，比如生命周期的各种钩子

疑问：

1. 为什么要定义那些配置？
2. 暴露了一些工具方法在 Vue.util， 但又不推荐使用，那为什么要暴露出去？
