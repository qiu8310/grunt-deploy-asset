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
  remoteBaseURL = 'http://' + bucket + '.qiniudn.com/';


  qiniu.conf.ACCESS_KEY = ak;
  qiniu.conf.SECRET_KEY = sk;
};



exports.upload = function(file, cb, dry) {

  var extname = path.extname(file),
    content = grunt.file.read(file),
    key;

  if (typeof prefix === 'function') {
    key = prefix(file);
  }
  key = key || (typeof prefix === 'string' ? prefix : '') + md5(content) + extname;

  if (dry) {

    cb(false, remoteBaseURL + key);

  } else {

    var token = new qiniu.rs.PutPolicy(bucket).token();
    qiniu.io.putFile(token, key, file, null, function(err, ret) {
      cb(err, remoteBaseURL + ret.key );
    });

  }

};