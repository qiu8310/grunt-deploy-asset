/*
 * grunt-deploy-asset
 * https://github.com/qiu8310/grunt-deploy-asset
 *
 * Copyright (c) 2014 Zhonglei Qiu
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
  // load all npm grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['test/tmp']
    },

    // Configuration to be run (and then tested).
    da: {
      options: {
        rootDir: 'test/fixtures',
        dry: true,
        logLevel: 'silent',
        rename: function(oldBasename) { return oldBasename.replace(/^\w+/, 'h'); }
      },
      defaults: {
        options: {
          outDir: '../tmp/defaults'
        },
        files: {
          'default-options': ['test/fixtures/b.css']
        }
      },
      customs: {
        options: {
          outDir: '../tmp/customs',
          unbrokenFiles: 'b.css'
        },
        files: {
          'custom-options': ['test/fixtures/b.css']
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*-test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'da', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
