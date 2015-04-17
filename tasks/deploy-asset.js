'use strict';

var da = require('deploy-asset');
var path = require('path');


module.exports = function (grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('da', 'Deploy web asset files to server.', function() {

    var done = this.async();

    // More configurable item on: http://qiu8310.github.io/deploy-asset/global.html#da

    var opts = this.options({
      rootDir: '',
      includes: [], // da's globPatterns
      excludes: [],
      outDir: false,
      force: false,
      dry: false,
      uploader: 'qiniu',
      logLevel: 'warn',
      uploaderOptions: {}
    });

    if (!opts.rootDir) {
      grunt.fail.fatal('Please config `rootDir` in your task\'s options');
    }

    var dir = path.resolve(opts.rootDir);
    var globPatterns = [].concat(opts.includes);

    this.files.forEach(function (f) {
      f.src.forEach(function (filepath) {
        filepath = path.resolve(filepath);
        var relative = path.relative(dir, filepath);
        if (relative.indexOf('..') === 0) {
          grunt.fail.fatal('File ' + filepath + ' is not inside the rootDir');
        }
        globPatterns.push(relative);
      });
    });

    da(dir, globPatterns, opts, function(err, fileMap) {
      if (err) {
        grunt.fail.fatal(err.stack || err);
      }

      var localFiles = Object.keys(fileMap);

      if (localFiles.length > 0) {
        localFiles.forEach(function(path) {
          grunt.verbose.write('Upload ' + path + '  =>  ' + fileMap[path].remote.path);
        });

        grunt.log.ok('Deploy ' + localFiles.length + ' successfully!');

        done();
      }
    });
  });

};