
module.exports = (function() {

  var specialChars = '-|/\\[]{}().*+?^$';
  var specialCharsRE = new RegExp('[' + specialChars.split('').join('\\') + ']', 'g');
  var cacheMap = {};

  /**
   * 转义字符串中特殊的正则中的字符
   */
  function escape(str) {
    return str.replace(specialCharsRE, '\\$&');
  }

  /**
   * 返回 mix 中类型在 types 中的所有值
   * @returns Array
   */
  function getTypedArray(mix, types) {
    if (!mix) {
      return [];
    }

    types = types || 'string';
    if (!Array.isArray(types)) {
      types = [types];
    }

    if (!Array.isArray(mix)) {
      mix = [mix];
    }

    return mix.filter(function(item) {
      return types.indexOf(typeof item) >= 0;
    });
  }


  function regexpEscape(mix) {
    if (Array.isArray(mix)) {
      return mix.map(function(str) { return regexpEscape(str); });
    } else if (typeof mix === 'string') {
      return escape(mix);
    } else {
      return mix;
    }
  }

  function toEscapedArray(arg) {
    return arg ? regexpEscape(getTypedArray(arg)) : [];
  }

  function cache(key, val) {
    if (val === undefined) {
      return cacheMap[key];
    } else {
      cacheMap[key] = val;
      return val;
    }
  }

  function defaultRegExpAttr(arg, def) {
    return typeof arg === 'string' ? arg : def;
  }

  function makeRE(reStr, tags, tagAttrs, regexpAttrs) {
    regexpAttrs = defaultRegExpAttr(regexpAttrs, 'gi');

    var tagsStr, tagAttrsStr;

    tags = toEscapedArray(tags);
    tagsStr = tags.length === 0 ? '' : '(' + tags.join('|') + ')';

    tagAttrs = toEscapedArray(tagAttrs);
    tagAttrsStr = tagAttrs.length === 0 ? '' : '(' + tagAttrs.join('|') + ')';

    // NOTE: 只替换一次！
    reStr = reStr.replace('{$tags}', tagsStr);
    reStr = reStr.replace('{$attrs}', tagAttrsStr);

    var cacheKey, cacheVal;
    cacheKey = [reStr, regexpAttrs].join('&');
    cacheVal = cache(cacheKey);

    if (!cacheVal) {
      cacheVal = cache(cacheKey, new RegExp(reStr, regexpAttrs));
    }

    return cacheVal;
  }




  return {

    escape: escape,

    /**
     * 匹配HTML TAG中的属性
     *
     * 正则返回
     * $0: 属性全值
     * $1: 属性名
     * $2: 属性值上的引号
     * $3: 属性值
     *
     */
    htmlAttrRE: function(tagAttrs, regexpAttrs) {
      return makeRE('<[^>]*\\s{$attrs}=([\'"])(.*?)\\2[^>]*\\/?>', false, tagAttrs, regexpAttrs);
    },


    /**
     * 生成 html 闭合标签的正则，如 <script></script>
     * 但不支持 tag 中嵌入相同的 tag
     *
     * 正则返回:
     *  $0: 整个标签
     *  $1: 标签名
     *  $2: 标签上的所有属性组成的字符串(注意 trim 处理)
     *  $3: 标签内的所有内容
     *
     */
    htmlDoubleTagRE: function(tags, regexpAttrs) {
      // 使用 ((?:\\s+[^>]*)?) 是为了当标签不含任何属性时，不要返回 undefined，而是返回空字符串
      return makeRE('<{$tags}((?:\\s[^>]*)?)>([^<]*)<\\/\\1>', tags, false, regexpAttrs);
    },

    /**
     * 生成 html 闭合标签上某属性的正则
     *
     * 正则返回：
     *  $0: 整个标签
     *  $1: 标签名
     *  $2: 标签上的所有属性组成的字符串
     *  $3: 属性名
     *  $4: 属性值上的 单引号/双引号
     *  $5: 指定的属性的值
     *  $6: 标签的内容
     *
     */
    htmlDoubleTagAttrRE: function(tags, tagsAttrs, regexpAttrs) {
      var reStr = '<{$tags}((?:\\s[^>]*)?\\s{$attrs}=([\'"])(.*?)\\4[^>]*)>([^<]*)<\\/\\1>';

      return makeRE(reStr, tags, tagsAttrs, regexpAttrs);
    },

    /**
     * 生成 html 非闭合标签的正则， 如 <img />
     *
     * 正则返回：
     *  $0: 整个标签
     *  $1: 标签名
     *  $2: 标签上的所有属性组成的字符串
     */
    htmlSingleTagRE: function(tags, regexpAttrs) {
      return makeRE('<{$tags}((?:\\s+[^>]*?)?)\\/?>', tags, false, regexpAttrs);
    },

    /**
     * 生成 html 非闭合标签上某属性的正则， 如 <img src="" />
     *
     * 正则返回：
     *  $0: 整个标签
     *  $1: 标签名
     *  $2: 标签上的所有属性组成的字符串
     *  $3: 属性名
     *  $4: 属性的值上的引号（单引号或双引号）
     *  $5: 指定的属性的值
     *
     */
    htmlSingleTagAttrRE: function(tags, tagsAttrs, regexpAttrs) {
      var reStr = '<{$tags}((?:\\s[^>]*)?\\s{$attrs}=([\'"])(.*?)\\4[^>]*?)\\/?>';
      return makeRE(reStr, tags, tagsAttrs, regexpAttrs);
    },

    /**
     * 生成 html 注释的正则，即 <!-- -->
     */
    htmlCommentRE: function(regexpAttrs) {
      regexpAttrs = defaultRegExpAttr(regexpAttrs, 'g');
      return makeRE('<!--([\\s\\S]*?)-->', false, false, regexpAttrs);
    },

    /**
     * 多行注释的正则，  css/js中可以用的
     */
    multipleLineCommentRE: function(regexpAttrs) {
      regexpAttrs = defaultRegExpAttr(regexpAttrs, 'g');
      return makeRE('\\/\\*([^]*?)\\*\\/', false, false, regexpAttrs);
    },

    /**
     * 单行注释的正则，  js中可以用的
     */
    singleLineCommentRE: function(regexpAttrs) {
      regexpAttrs = defaultRegExpAttr(regexpAttrs, 'gm');
      if (regexpAttrs.indexOf('m') === -1) {
        regexpAttrs += 'm';
      }
      return makeRE('\\/\\/(.*?)$', false, false, regexpAttrs);
    },

    /**
     * 得到匹配 CSS 中 background 的资源
     *
     * 正则返回：
     *  $1: background 或 background-image 中指定的 url 中的内容
     */
    cssBackgroundUrlRE: function(regexpAttrs) {
      var reStr = 'background(?:-image)?\\s*:\\s*url\\([\'"]?(.*?)[\'"]?\\)';
      return makeRE(reStr, false, false, regexpAttrs);
    },


    /**
     * 得到匹配 CSS 中指定的属性的正则
     *
     * 正则返回：
     *  $0: 整个样式
     *  $1: 属性名
     *  $2: 属性对应的值
     */
    cssAttrsRE: function(cssAttrs, regexpAttrs) {
      var reStr = '{$tags}\\s*:\\s*(.*?)(?=[\\};])';
      return makeRE(reStr, cssAttrs, false, regexpAttrs);
    }
  };
})();