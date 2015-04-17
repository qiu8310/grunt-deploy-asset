# grunt-deploy-asset

[![NPM version](https://badge.fury.io/js/grunt-deploy-asset.svg)](https://npmjs.org/package/grunt-deploy-asset)
[![Build Status](https://travis-ci.org/qiu8310/grunt-deploy-asset.svg)](https://travis-ci.org/qiu8310/grunt-deploy-asset)


> 部署静态文件到远程CDN服务器（当前只支持"七牛")
>
> [做此项目时总结的相关正则表达示的知识](regexp-help.md)

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-deploy-asset --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-deploy-asset');
```

## The "da" task

### Overview

In your project's Gruntfile, add a section named `da` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  da: {
    options: {
      rootDir: '',        // 必须要的一个参数，指定要上传的文件的根目录，所以文件必须在此目录之内
      includes: [],       // 这里的文件会添加到 `globPatterns`
      excludes: [],       // 这里的文件会排除出 `globPatterns`
      unbrokenFiles: [],  // 这里的文件的内容不会更新，即文件内容所包含的静态文件都不会更新
      prefix: '',         // 远程文件名的前缀
      outDir: false,      // 相对于 rootDir 的一个路径，用于输出上传的文件
      uploader: 'qiniu',  // 目前只支持 七牛
      uploaderOptions: {  //七牛相关的配置
        ak: "...",
        sk: "...",
        domain: "..."
      }
      force: false,
      dry: false // 只显示操作结果，不实际上传文件
          },
    yourTarget: {
      // Target 中只要指定你要处理的 HTML、CSS 文件即可，其它静态文件都可以通过这两类文件索引到，索引不到的不会上传，有索引，但文件不存在的会出 warning 提醒
    }
  }
})
```

### Options

[Based on deploy-asset project's options](http://qiu8310.github.io/deploy-asset/global.html#da)




## Release History

* 2015-04-18  1.0.0

  - 单独写了一个 [deploy-asset](https://github.com/qiu8310/deploy-asset) 模块，所以此插件完全依赖于它了
  - 从以前的 `deployAsset` task 改成了 `da` task，简单明了
  

* 2015-01-06  0.0.5
  
  - 七牛的域名可指定
  - 配置 deleteUploaded 默认改为 false

* 2014-12-09  0.0.4

  - 添加配置 `mapUpload`
  - 添加配置 `overwrite`
    
* 2014-12-08  0.0.3

  - 添加配置`ignoreAssetNotExist`
  - 添加配置`ignoreUploadAssets`
  - 添加配置`assetMapJsonFile`
  - 如果静态资源路径中包含 `<...>` 或 `{...}`，并且资源不存在，则忽略此资源，因为这可能是一些动态模板文件的变量
    
    
* 2014-11-30  0.0.2

  - 支持 angular 中的 templateUrl 处理.
    
    
* 2014-11-29  0.0.1

    - 首次发布.

