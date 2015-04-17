
module.exports = {
  options: {

  },
  css: (function() {
    var reCSS =  /(?:src=|url\(\s*)['"]?([^'"\)#?]+)(?:[#?](?:[^'"\)]*))?['"]?\s*\)?/g;

    return function(cb, fileContent, filePath, options) {
      fileContent.replace(reCSS, function(sentence, src, index) {
        cb(sentence, src, index);
      });
    };
  })(),

  html: (function() {

    // HTML 中的 img/audio/video 中的 src
    // HTML 中的 element 属性中的 data-asset
    // HTML 中的 style 中的 background 及 background-image
    // HTML 中的 inline style 中的 background 及 background-image

    // 忽略 HTML 中的 JS CSS
    var regexps = [
      // 必须存在资源，否则报错
      [/<(?:img|video|audio)[^\>]+src=['"]([^"']+)["']/g,
        'Update the HTML with the new img/video/audio filenames'
      ],
      [/<input[^\>]+src=['"]([^"']+)["']/g,
        'Update the HTML with reference in input'
      ],
      [/<link[^\>]+href=['"]([^"']+)["']/g,
        'Update the HTML with the new link filenames (without css)',
        function(src) {
          return src.split(/\?|#/).shift().split('.').pop() !== 'css';
        }
      ],

      // 资源可以不存在
      [/data-[A-Za-z0-9]*=['"]([^"']+)["']/g,
        'Update the HTML with the data tags'
      ],
      [/url\(\s*['"]([^"']+)["']\s*\)/g,
        'Update the HTML with background imgs, case there is some inline style'
      ],
      [/<a[^\>]+href=['"]([^"']+)["']/g,
        'Update the HTML with anchors images'
      ]
    ];

    return function(cb, fileContent, filePath, options) {
      regexps.forEach(function(re, reIndex) {
        fileContent.replace(re[0], function(sentence, src, index) {
          var filterFn = re[2];
          if (typeof filterFn !== 'function' || filterFn(src) === true ) {
            if (reIndex >= 3) {
              cb(sentence, src, index, true); // 最后一个参数：如果指定的资源不存在，则不要报错
            } else {
              cb(sentence, src, index);
            }
          }
        });
      });
    };
  })()
};