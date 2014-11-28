# grunt-deploy-asset

> 部署静态文件到远程CDN服务器（当前只支持"七牛")

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

## The "deployAsset" task

### Overview
In your project's Gruntfile, add a section named `deployAsset` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  deployAsset: {
    options: {
      uploader: 'qiniu', // 目前只支持 七牛
      qiniu: { //七牛相关的配置
        accessKey: "...",
        secretKey: "...",
        bucket: "...",
        prefix: "t-"  // 上传到七牛后的文件名的前缀
      }
      uploadCSS: true,
      uploadJS: true,
      uploadHTML: true,
      deleteUploaded: true,
      dry: false // 只显示操作结果，不实际上传文件或删除文件
    },
    yourTarget: {
      // Target-specific file lists and/or options go here.
      // Target 中只要指定你要处理的 HTML、CSS 文件即可，其它静态文件都可以通过这两类文件索引到，索引不到的不会上传，有索引，但文件不存在的会出 warning 提醒
    }
  }
})
```

### Options

#### options.uploader
Type: `String`
Default value: `null`

指定要选用的上传工具，当前只支持七牛，即此处只能填 'qiniu'

#### options[options.uploader]
Type: `Object`
Default value: `null`

将你的 `uploader` 是 `'qiniu'` 或其它上传工具时，你可以为此上传工具指定选项，只要在 options 上配置 `options.qiniu` 即可


#### options.uploadCSS / options.uploadJS / options.uploadHTML
Type: `boolean`
Default value: `true`

是否将 CSS / JS / HTML 文件上传到CDN服务器上

#### options.dry
Type: `boolean`
Default value: `false`

只是显示操作结果，不实际上传文件或删除文件


### Usage Examples

#### Default Options

```js
grunt.initConfig({
  deployAsset: {
    options: {
      uploader: null,
      uploadCSS: true,
      uploadJS: true,
      uploadHTML: true,
      deleteUploaded: true,
      dry: false
    }
  },
})
```

#### Custom Options

```js
grunt.initConfig({
  deployAsset: {
    options: {
      uploader: 'qiniu',
      qiniu: require('./qiniu.json'),
      uploadHTML: false
    },
    dist: ['<%= yeoman.dist %>/**/*.{html,htm,css}']
  },
})
```

### TODO

Test


