# vue-source-note

Vue 源码阅读笔记

### Vue 源码版本

直接从 Vue 仓库获取代码，默认是 dev 分支， `git tag` 可以看到所有的版本，这次阅读的是 **2.5.9** 版本的代码。

### 编辑器准备

平时写 JS 主要使用 VS Code 编辑器，而 Vue 2.x 版本的源码使用了 Flow, 在语法和高亮上存在一些问题，所以需要做些工作。

- 安装 `Flow Language Support` 插件，并按照插件提示将 settings 里的 `javascript.validate.enable` 设为 false

- 安装 `JavaScript Atom Grammar` 语法支持

第一步主要是 flow 语法报错问题，第二步可以解决部分文件高亮混乱的问题。

### Vue 依赖安装问题

Vue 的 node_modules 里有 phantomjs, 还会安装 chromedriver, 由于众所周知的原因，可能会失败，可以添加 .npmrc 文件改淘宝源

```
phantomjs_cdnurl=https://cdn.npm.taobao.org/dist/phantomjs
chromedriver_cdnurl=https://cdn.npm.taobao.org/dist/chromedriver
```
