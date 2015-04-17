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
Tag.prototype.asset = function(src) {
  if (typeof src === 'undefined') {
    return this.getData().asset;
  } else {
    this.data.asset = src;
  }
};


// 循环删除空的父文件夹
function deleteEmptyParentFolders(file) {
  var dir = path.dirname(file);
  var files = fs.readdirSync(dir);
  if (files && files.length === 0) {
    fs.rmdirSync(dir);
    deleteEmptyParentFolders(dir);
  }
}


// 记录本次部署成功的所有本地文件和远程文件之间的对应关系
var allAssetMap = {},
  assignToAllAssetMap = function(assetMap) {
    Object.keys(assetMap || {}).forEach(function(key) {
      if (assetMap[key]) { // 保存远程文件是存在的
        allAssetMap[key] = assetMap[key];
      }
    });
  };


function Adapter(type, options, files, uploader, _grunt) {
  var self = this, finder;
  grunt = _grunt; // 保留 grunt

  this.type = type;
  this.originalFiles = files; // 在删除文件时，如果存在这里面，要把这里的文件也删除了
  this.uploader = uploader;
  this.gruntOptions = options;

  this.assetsMap = {};   // localAsset => remoteAsset
  this.fileCtrlMap = {}; // textFile => Ctrl

  this.finder = finder = require('./asset-finders/' + type + '-finder.js');
  options = this.option(options); // 这个 options 是 finder 里设置的，可以在 grunt 里配置，传递给 finder

  files.forEach(function(file) {
    var fileType = getFileType(file),
      fn, tags, content, dir;

    fn = finder[fileType];
    if (typeof fn === 'function') {

      content = grunt.file.read(file);
      dir = path.dirname(file);

      tags = [];
      fn(function(sentence, src, index, sience) {
        return self._pushTag(tags, dir, src, sentence, index, {sience: sience});
      }, content, file, options);



      // 检查 tag 中的 asset 是否都存在
      tags = tags.filter(function(tag) {
        var asset = tag.asset();
        if (!asset) { // 如果没设置 asset，直接忽略
          return false;
        }
        if (!fs.existsSync(asset) && !self.gruntOptions.ignoreAssetNotExist) {  // 静态资源不存在，发出警告
          grunt.fail.warn('Asset not exist ' + asset);
          return false;
        }
        return true;
      });


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

  addAsset: function(asset, remoteName) {
    if (typeof asset === 'object') {
      var self = this;
      Object.keys(asset).forEach(function(src) {
        self.addAsset(src, asset[src] || false);
      });

    } else if (
      (typeof asset === 'string') &&
      !(asset in this.assetsMap) &&

        // 判断文件是否在之前的上传中已经上传过，上传过则不再上传了
      !(asset in allAssetMap) &&

        // 文件不应该在忽略上传的列表中
      ! grunt.file.isMatch(this.gruntOptions.ignoreUploadAssets, asset.replace(process.cwd() + path.sep, ''))
    ) {
      this.assetsMap[asset] = remoteName || false;
    }
    return this;
  },

  _pushTag: function(tags, dir, src, sentence, index, opts) {
    src = src.trim().split(/\?|#/).shift(); // 去掉资源后面的参数

    // 忽略远程地址
    if (src && src.indexOf('http://') !== 0 && src.indexOf('//') !== 0) {
      opts.asset = path.resolve(dir, src);

      // 忽略地址中包含 < > 或 { } 这种可能是静态变量的文件
      if (!fs.existsSync(opts.asset) && (opts.sience || /\{.+\}|<.+>/.test(opts.asset))) {
        return false;
      }

      var tag = new Tag(sentence, src, index, opts);
      tags.push(tag);
      return tag;
    }

    return false;
  },

  _updateToLocal: function() {
    var assetsMap = this.assetsMap,
      fileCtrlMap = this.fileCtrlMap,
      dry = this.gruntOptions.dry;

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
      dry = this.gruntOptions.dry,
      originalFiles = this.originalFiles;

    Object.keys(assetsMap).forEach(function(local) {
      if (assetsMap[local]) {
        if (!dry) {
          grunt.file.delete(local);
          deleteEmptyParentFolders(local);
        }

        var existIndex = originalFiles.indexOf(local);
        if (existIndex >= 0) {
          originalFiles.splice(existIndex, 1);
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
            if (self.gruntOptions.deleteUploaded) {
              self._deleteUploaded();
            }
            assignToAllAssetMap(assetsMap);
            deferred.resolve(assetsMap);
          }
        };
      };
    if (assetLen === 0) {
      deferred.resolve(assetsMap);
    } else {
      // 一个个文件上传
      assets.forEach(function(asset) {
        uploader.upload(asset, uploadedFn(asset), {
          dry: self.gruntOptions.dry,
          overwrite: self.gruntOptions.overwrite,
          remoteName: assetsMap[asset]
        });
      });
    }

    return deferred.promise;

  }
};


Adapter.getAllAssetMap = function() {
  return allAssetMap;
};

module.exports = Adapter;