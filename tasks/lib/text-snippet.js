/*
 *
 * http://github.com/qiu8310/text-tag
 *
 * Copyright (c) 2014 Zhonglei Qiu
 * Licensed under the MIT license.
 */

//== exports
var TextSnippet = {};


//== Tag
/**
 * ctrl: Ctrl
 *
 * raw: String
 * rawLeft: String
 * rawRight: String
 *
 * startIndex: Number
 * endIndex: Number
 *
 * isFirst: Boolean
 * isLast: Boolean
 *
 * next: Tag or Null
 * prev: Tag or Null
 *
 * data: Object
 *
 */
function Tag(raw, value, index, data) {

  this.ctrl = null;

  this.raw = raw;
  this.originValue = value;

  // compute raw left/right
  var pos = raw.indexOf(value);
  if (pos < 0) {
    throw new Error('Tag.raw should contains Tag.value');
  }
  this.rawLeft = raw.substring(0, pos);
  this.rawRight = raw.substr(pos + value.length);


  this.startIndex = index;
  this.endIndex = index + raw.length;
  this.data = data;


  // next and prev Tag
  this.next = null;
  this.prev = null;

}

Tag.prototype = {
  getContent: function() {
    return this.ctrl.content;
  },

  getData: function() {
    return this.data;
  },

  setData: function(data) {
    this.data = data;
  },

  setValue: function(value) {
    this.value = value;
  },

  toString: function() {
    return this.rawLeft + (this.value || this.originValue) + this.rawRight;
  }
};



//== Tag Ctrl
/**
 *  tags: Array
 *
 *  content: String
 *  contentLength: Number
 *
 *  processFn: Function
 *
 *  firstTag: Tag or Null
 *  lastTag: Tag or Null
 */
function Ctrl(content, tags, processFn) {
  this.tags = tags || [];
  this.processFn = processFn;

  this.content = content;
  this.contentLength = content.length;

  this.firstTag = null;
  this.lastTag = null;

  this.update();
}

Ctrl.prototype.addTag = function(tag) {
  this.tags.push(tag);
  this.update();
};

Ctrl.prototype.each = function(fn) {
  this.tags.forEach(fn);
};

// 更新每个 tag 的属性
Ctrl.prototype.update = function() {
  var tags = this.tags,
    self = this;

  // 将 tags 按照 startIndex 排序
  tags.sort(function(a, b) { return a.startIndex - b.startIndex; });

  var lastIndex = this.tags.length - 1;

  // 设置Tag 的 prev、next、isFirst、isLast 及 Ctrl 的 firstTag, lastTag 属性
  this.each(function(tag, index) {
    tag.ctrl = self;
    tag.isFirst = index === 0;
    tag.isLast = index === lastIndex;

    tag.prev = index > 0 ? tags[index - 1] : null;
    tag.next = index < lastIndex ? tags[index + 1] : null;

    if (tag.isFirst) {
      self.firstTag = tag;
    }
    if (tag.isLast) {
      self.lastTag = tag;
    }
  });

  // 检查有无重叠的 tags，即当前 tag 的 endIndex 一定小于等于 next tag 的 startIndex
  this.each(function(tag) {
    if(tag.next && tag.endIndex > tag.next.startIndex) {
      throw new Error('Tags overlap ' + tag.toString() + ' ' + tag.next.toString());
    }
  });
};


Ctrl.prototype.toString = function(processFn) {
  this.update();

  var rtn = [],
    start = 0,
    content = this.content;

  // 没有 tags，直接返回原内容
  if (this.tags.length === 0) {
    return content;
  }


  var fn = processFn || this.processFn;
  if (typeof fn === 'function') {
    this.each(function(tag) {
      fn.call(tag.ctrl, tag);
    });
  }

  // 组装内容
  this.each(function(tag) {
    rtn.push(content.substring(start, tag.startIndex));
    rtn.push(tag.toString());

    start = tag.endIndex;

    if (tag.isLast) {
      rtn.push(content.substr(start));
    }
  });

  return rtn.join('');

};



TextSnippet.Ctrl = Ctrl;
TextSnippet.Tag = Tag;


module.exports = TextSnippet;
