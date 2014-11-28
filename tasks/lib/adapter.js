var path = require('path'),
  fs = require('fs'),
  Q = require('q'),
  Ctrl = require('./text-snippet').Ctrl,
  Tag = require('./text-snippet').Tag;

var grunt;
var FILE_TYPE = {
  UNKNOWN: 0,
  HTML: 'html',
  CSS: 'css',
  JS: 'js'
};

function getFileType(file) {
  var ext = file.split('.').pop().toLowerCase();

  if (['html', 'htm'].indexOf(ext) >= 0) {
    return FILE_TYPE.HTML;
  } else if (['css'].indexOf(ext) >= 0) {
    return FILE_TYPE.CSS;
  } else if (['js'].indexOf(ext) >= 0) {
    return FILE_TYPE.JS;
  } else {
    return FILE_TYPE.UNKNOWN;
  }
}

// 获取 tag 上的静态资源
Tag.prototype.asset = function() {
  return this.getData();
};

// 生成  Ctrl 中的 tag
function pushTag(tags, dir, src, sentence, index, sience) {
  src = src.trim().split(/\?|#/).shift(); // 去掉资源后面的参数

  // 忽略远程地址
  if (src.indexOf('http://') !== 0 && src.indexOf('//') !== 0) {
    var asset = path.resolve(dir, src);
    if (fs.existsSync(asset)) {
      tags.push(new Tag(sentence, src, index, asset));
    } else {
      if (!sience) {
        grunt.fail.warn('Asset not exist ' + asset);
      }
    }
  }
}


// 循环删除空的父文件夹
function deleteEmptyParentFolders(file) {
  var dir = path.dirname(file);
  var files = fs.readdirSync(dir);
  if (files && files.length === 0) {
    fs.rmdirSync(dir);
    deleteEmptyParentFolders(dir);
  }
}


function Adapter(type, options, files, uploader, _grunt) {
  var self = this, finder;
  grunt = _grunt; // 保留 grunt

  this.uploader = uploader;
  this.dry = options.dry;
  this.deleteUploaded = options.deleteUploaded;

  this.assetsMap = {};   // localAsset => remoteAsset
  this.fileCtrlMap = {}; // textFile => Ctrl

  this.finder = finder = require('./asset-finders/' + type + '-finder.js');
  options = this.option(options);

  files.forEach(function(file) {
    var fileType = getFileType(file),
      fn, tags, content, dir;

    fn = finder[fileType];
    if (typeof fn === 'function') {
      content = grunt.file.read(file);
      dir = path.dirname(file);

      tags = [];
      fn(function(sentence, src, index, sience) {
        pushTag(tags, dir, src, sentence, index, sience);
      }, content, file, options);

      // 保存 Ctrl
      var ctrl = new Ctrl(content, tags);

      // 文件无 tag，则不需要处理
      if (ctrl.tags.length > 0) {
        self.fileCtrlMap[file] = ctrl;

        // 添加静态资源
        ctrl.each(function(tag) {
          self.addAsset(tag.asset());
        });
      }
    }
  });

}


Adapter.prototype = {
  option: function(userOpts) {
    if (this.options) {
      return this.options;
    }

    userOpts = userOpts || {};
    var options = {};
    var defOpts = this.finder.options || {};
    Object.keys(defOpts).forEach(function(key) {
      options[key] = (key in userOpts) ? userOpts[key] : defOpts[key];
    });

    this.options = options;
    return options;
  },

  addAsset: function(asset) {
    if ((typeof asset === 'string') && !(asset in this.assetsMap)) {
      this.assetsMap[asset] = false;
    }
  },
  // grunt-deploy-asset
  _updateToLocal: function() {
    var assetsMap = this.assetsMap,
      fileCtrlMap = this.fileCtrlMap,
      dry = this.dry;

    // 上传完成，将新的 url 更新到文件中
    Object.keys(fileCtrlMap).forEach(function(file) {
      var ctrl = fileCtrlMap[file];
      ctrl.each(function(tag) {
        var remoteAsset = assetsMap[tag.asset()];
        if (typeof remoteAsset === 'string') {
          tag.setValue(remoteAsset);
        }
      });

      if (!dry) {
        grunt.file.write(file, ctrl.toString());
      }
      grunt.log.ok('Update file ' + file + ' ok');
    });
  },

  _deleteUploaded: function() {
    var assetsMap = this.assetsMap,
      dry = this.dry;

    Object.keys(assetsMap).forEach(function(local) {
      if (assetsMap[local]) {
        if (!dry) {
          grunt.file.delete(local);
          deleteEmptyParentFolders(local);
        }
        grunt.log.ok('Delete ' + local + ' ok');
      }
    });
  },

  upload: function(uploader) {
    var assetsMap = this.assetsMap,
      self = this,
      deferred = Q.defer();

    uploader = uploader || this.uploader;

    // 将 assetsMap 中的 keys 上传到 target
    var assets = Object.keys(assetsMap),
      assetLen = assets.length,
      finishLen = 0,
      uploadedFn = function(localFile) {
        return function(err, remoteFile) {
          if (err) {
            deferred.reject(err);
          }
          assetsMap[localFile] = remoteFile;

          finishLen += 1;
          if (finishLen === assetLen) {
            self._updateToLocal();
            if (self.deleteUploaded) {
              self._deleteUploaded();
            }
            deferred.resolve(assetsMap);
          }
        };
      };

    if (assetLen === 0) {
      deferred.resolve(assetsMap);
    } else {
      // 一个个文件上传
      assets.forEach(function(asset) {
        uploader.upload(asset, uploadedFn(asset), self.dry);
      });
    }

    return deferred.promise;

  }
};


module.exports = Adapter;