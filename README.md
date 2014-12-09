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
      ignoreAssetNotExist: false,  // 0.0.3添加参数，是否忽略资源不存在时的警告信息
      ignoreUploadAssets: [],  // 0.0.3添加参数，指定不要上传的文件
      assetMapJsonFile: null, // 0.0.3添加参数，生成文件映射关系存放在本地
      mapUpload: false, // 0.0.4添加， 指定上传文件的名称， src => dest 的形式部署，部署后文件的名称为 dest
      overwrite: false, // 0.0.4添加， 有同名文件是否覆盖
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

#### options.angularTplTransform __ 0.0.2新添加的 __
Type: `function`

Default value:
```js
  angularTplTransform: function(tplPath, tplCalledBy) {
    return tplPath.replace(/\/scripts?\//, '/');
  }
```

由于 angular 的模板文件定义在 js 中，而模板又不是相对于 js 定位的，所以需要手动处理下经的路径，
默认处理方式只是把路径中的 scripts 或 script 去掉而已。

如果这个函数返回 false，则表示忽略这个文件，此文件就不会传到 CDN 上了

#### options.ignoreAssetNotExist  __ 0.0.3新添加的 __
Type: `boolean`

Default value: `false`

是否忽略所有静态文件不存在的错误提醒，默认为`false`，可以用 `grunt deployAsset --force` 强制忽略。

建议设置为`false`，这样你就可以知道你的项目中是否使用了一些不存在的静态文件

__ 注意：如果deploy时，因为某些静态文件不存在而导致编译失败，当你只是加上 --force 去 deploy是不行的，还得重新编译下你的文件，因为你本地的一些编译后的文件可能已经更新了(WILL FIXED) __


#### options.ignoreUploadAssets __ 0.0.3新添加的 __
Type: `string` or `array`

Default value: `[]`

指定的文件不会上传到CDN上，配置方法可以像配置 `grunt` 文件一样，使用的是[`grunt.file.match`方法](http://gruntjs.com/api/grunt.file#grunt.file.match)


#### options.assetMapJsonFile __ 0.0.3新添加的 __
Type: `string`

Default value `null`

指定一个JSON文件路径，用来生成一个本地文件到远程文件的关系映射的JSON文件，默认不生成任何文件

#### options.mapUpload __ 0.0.4新添加的 __
Type: `boolean`

Default value `false`

如果为 `true`，则会保存 `grunt` 中配置的 dest 文件名称，上传时会把它设置成上传后的文件名称


#### options.overwrite __ 0.0.4新添加的 __
Type: `boolean`

Default value `false`

是否覆盖重名文件，如果为 `false` 并且出现了重名文件，会报错

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
      angularTplTransform: function(tplPath, tplCalledBy) { return tplPath.replace(/\/scripts?\//, '/'); },
      ignoreAssetNotExist: false,
      ignoreUploadAssets: [],
      assetMapJsonFile: null,
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

* 如果deploy时，因为某些静态文件不存在而导致编译失败，当你只是加上 --force 去 deploy是不行的，还得重新编译下你的文件，因为你本地的一些编译后的文件可能已经更新了
* 处理 ng-include 包含的模板

## Release History

* 2014-12-09   0.0.4
    1. 添加配置 `mapUpload`
    2. 添加配置 `overwrite`
    
* 2014-12-08   0.0.3    
    1. 添加配置`ignoreAssetNotExist`
    2. 添加配置`ignoreUploadAssets`
    3. 添加配置`assetMapJsonFile`
    4. 如果静态资源路径中包含 `<...>` 或 `{...}`，并且资源不存在，则忽略此资源，因为这可能是一些动态模板文件的变量
    
* 2014-11-30   0.0.2    支持 angular 中的 templateUrl 处理.
* 2014-11-29   0.0.1    首次发布.

