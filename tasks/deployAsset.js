/*
 * grunt-deploy-asset
 * https://github.com/qiu8310/grunt-deploy-asset
 *
 * Copyright (c) 2014 Zhonglei Qiu
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  var Adapter = require('./lib/adapter'),
    path = require('path');

  grunt.registerMultiTask('deployAsset', '部署静态文件到远程CDN服务器（当前只支持"七牛")', function () {

    var uploader,
      done = this.async(), // 异步部署
      options = this.options({
        uploader: null,
        uploadCSS: true,
        uploadJS: true,
        uploadHTML: true,
        deleteUploaded: false,
        ignoreAssetNotExist: false,
        ignoreUploadAssets: [], // 指定的文件不上传到CDN上
        assetMapJsonFile: null,
        angularTplTransform: function(tplPath, tplCalledBy) { // angular 模板文件写在JS中，而模板文件的路径去不是相对于JS的
          return tplPath.replace(/\/scripts?\//, '/');
        },

        mapUpload: false, // 指定上传文件的名称 src => dest 的形式部署，部署后文件的名称为 dest
        overwrite: false, // 有同名文件是否覆盖

        dry: false // 只显示结果，不实际操作
      });

    if (!options.uploader || !options[options.uploader]) {
      grunt.fail.fatal('没有配置部署到的目标');
    }

    uploader = require('./lib/uploaders/' + options.uploader);
    if (uploader.init) {
      uploader.init(grunt, options[options.uploader]);
    }


    // 获取所有要处理的文件
    var files = [], fileMap = {};
    this.files.forEach(function (f) {
      f.src.forEach(function (filepath) {
        filepath = path.resolve(filepath);
        files.push(filepath);
        fileMap[path.basename(f.dest)] = filepath;
      });
    });

    var outputUploadResult = function(assetMap, title) {
      if (title) {
        grunt.log.writeln(title);
      }
      Object.keys(assetMap).forEach(function (local) {
        grunt.log.ok(local.replace(process.cwd(), '').substr(1) + ' => ' + assetMap[local]);
      });
    };
    var objectReverse = function(obj) {
      var result = {};
      Object.keys(obj).forEach(function(key) {
        result[obj[key]] = key;
      });
      return result;
    };
    var uploadError = function(err) {
      console.log(err);
      grunt.log.error(err.error);
    };

    // 指定远程文件名形式的上传
    if (options.mapUpload) {
      var mapAdapter = new Adapter('no', options, files, uploader, grunt),
        uploadAsset = objectReverse(fileMap);
      mapAdapter.addAsset(uploadAsset).upload().then(outputUploadResult, uploadError).then(done);

    } else {
      grunt.log.writeln('\r\nUpload static files in HTML/CSS:');
      (new Adapter('static', options, files, uploader, grunt)).upload()
        .then(function () {
          if (options.uploadCSS) {
            grunt.log.writeln('\r\nUpload css files in HTML:');
            return (new Adapter('css', options, files, uploader, grunt)).upload();
          }
        })
        // 处理 angular 需要在处理 JS 前面
        .then(function () {
          grunt.log.writeln('\r\nUpload angular templates:');
          return (new Adapter('angular-tpl', options, files, uploader, grunt)).upload();
        })
        .then(function () {
          if (options.uploadJS) {
            grunt.log.writeln('\r\nUpload js files in HTML:');
            return (new Adapter('js', options, files, uploader, grunt)).upload();
          }
        })
        .then(function () {
          // 上传 html 文件到服务器
          if (options.uploadHTML) {
            var adapter = new Adapter('no', options, files, uploader, grunt);

            files.forEach(function (f) {
              if (['html', 'htm'].indexOf(f.split('.').pop()) >= 0) {
                adapter.addAsset(f);
              }
            });

            grunt.log.writeln('\r\nUpload html files: ');
            return adapter.upload().then(outputUploadResult);
          }

        }).then(function() {
          if (options.assetMapJsonFile) {
            grunt.file.write(options.assetMapJsonFile, JSON.stringify(Adapter.getAllAssetMap(), null, '\t'));
          }
          done();
        });
    }

  });
};
