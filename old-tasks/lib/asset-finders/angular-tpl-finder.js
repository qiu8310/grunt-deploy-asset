var reTplUrl = /templateUrl:\s*['"]([^'"\\\n]+)['"]/g;

module.exports = {
  options: {
    angularTplTransform: null
  },
  js: function(createTagFn, fileContent, filePath, options) {
    fileContent.replace(reTplUrl, function(sentence, src, index) {
      var tag = createTagFn(sentence, src, index);

      if (tag && typeof options.angularTplTransform === 'function') {
        tag.asset(options.angularTplTransform(tag.asset(), filePath));
      }
    });
  }

  // ng-include="'views/partials/header.html'"
  //html: function(cb, fileContent, filePath, options) {
  //
  //}
};