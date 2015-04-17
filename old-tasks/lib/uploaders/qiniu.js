var qiniu = require('qiniu'),
  crypto = require('crypto'),
  path = require('path');

var bucket,
  grunt,
  prefix,
  remoteBaseURL;


function md5(content) {
  var hash = crypto.createHash('md5');
  hash.update(content);
  return hash.digest('hex');
}


exports.init = function(_grunt, options) {
  var ak = options.accessKey,
    sk = options.secretKey;

  bucket = options.bucket;
  prefix = options.prefix || '';
  grunt = _grunt;
  remoteBaseURL = 'http://' + (options.baseDomain || bucket + '.qiniudn.com') + '/';


  qiniu.conf.ACCESS_KEY = ak;
  qiniu.conf.SECRET_KEY = sk;
};



exports.upload = function(file, cb, opts) {

  opts = opts || {};

  var extname = path.extname(file),
    content = grunt.file.read(file),
    key, token;

  // 获取要上传文件的名字
  if (opts.remoteName) {
    key = opts.remoteName;
  } else {
    if (typeof prefix === 'function') {
      key = prefix(file);
    }
    key = key || (typeof prefix === 'string' ? prefix : '') + md5(content) + extname;
  }

  if (opts.dry) {

    cb(false, remoteBaseURL + key);

  } else {

    token = new qiniu.rs.PutPolicy(bucket + (opts.overwrite ? ':' + key : '')).token();
    qiniu.io.putFile(token, key, file, null, function(err, ret) {
      if (err) {
        err.localFile = file;
        err.remoteFile = key;
      }
      cb(err, remoteBaseURL + ret.key );
    });

  }

};