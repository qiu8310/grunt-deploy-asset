var re = /<link[^>]*\bhref=['"]([^'"]*)['"][^>]*\\?>/g;
module.exports = {
  options: {

  },
  html: function(cb, fileContent, filePath, options) {
    fileContent.replace(re, function(sentence, src, index) {
      if (src.trim().split(/#|\?/).shift().split('.').pop() === 'css') {
        cb(sentence, src, index);
      }
    });
  }
};