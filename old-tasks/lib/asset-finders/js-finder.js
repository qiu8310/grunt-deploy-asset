var re = /<script[^>]*\b(?:src|data-main)=['"]([^'"]*)['"][^>]*>\s*<\/script>/g;
module.exports = {
  options: {

  },
  html: function(cb, fileContent, filePath, options) {
    fileContent.replace(re, function(sentence, src, index) {
      src = src.split(/#|\?/).shift();

      if (src.split('.').pop() !== 'js') {
        src = src + '.js';
      }

      cb(sentence, src, index);
    });
  }
};