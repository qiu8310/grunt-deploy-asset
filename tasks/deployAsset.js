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
    path = require('path'),
    Q = require('q');

  grunt.registerMultiTask('deployAsset', '部署静态文件到远程CDN服务器（当前只支持"七牛")', function () {

    var uploader,
      done = this.async(), // 异步部署
      options = this.options({
        uploader: null,
        uploadCSS: true,
        uploadJS: true,
        uploadHTML: true,
        deleteUploaded: true,
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
    var files = [];
    this.files.forEach(function (f) {
      f.src.forEach(function (filepath) {
        files.push(path.resolve(filepath));
      });
    });


    try {

      var staticAdapter = new Adapter('static', options, files, uploader, grunt);
      staticAdapter
        .upload()
        .then(function () {

          grunt.log.ok('Upload static files in HTML/CSS ok\n');

        }).then(function () {

          return Q.fcall(function () {
            if (options.uploadCSS) {
              return (new Adapter('css', options, files, uploader, grunt))
                .upload()
                .then(function () {
                  grunt.log.ok('Upload css files in HTML ok\n');
                });
            }
          });

        }).then(function () {

          return Q.fcall(function () {
            if (options.uploadJS) {
              return (new Adapter('js', options, files, uploader, grunt))
                .upload()
                .then(function () {
                  grunt.log.ok('Upload js files in HTML ok\n');
                });
            }
          });

        }).then(function () {

          // 上传 html 文件到服务器
          return Q.fcall(function () {
            if (options.uploadHTML) {
              var adapter = new Adapter('no', options, files, uploader, grunt);

              files.forEach(function (f) {
                if (['html', 'htm'].indexOf(f.split('.').pop()) >= 0) {
                  adapter.addAsset(f);
                }
              });

              return adapter.upload().then(function (assetMap) {
                grunt.log.writeln('\r\nUpload html files: ');

                Object.keys(assetMap).forEach(function (local) {
                  grunt.log.ok(local.replace(process.cwd(), '').substr(1) + ' => ' + assetMap[local]);
                });
              });
            }
          });

        }).then(done);


    } catch (e) {
      grunt.fail.warn(e);
    }

  });
};
