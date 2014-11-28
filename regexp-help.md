# RegExp 正则表达式


## new RegExp(pattern, attributes)

* `pattern` 中的关键字符有 `-`,`|`,`/`,`\`,`[`,`]`,`{`,`}`,`(`,`)`,`.`,`*`,`+`,`?`,`^`,`$`，出现这些注意转义
* `attributes` 可以是 `g`,`i`,`m`


## 实例变量的属性

* `global`: 是否全局匹配，初始化时 `attributes` 带上 `g` 即可
	
* `ignoreCase`: 是否忽略大小写，初始化时 `attributes` 带上 `i` 即可
	
* `multiline`: 是否多行匹配，经常和`^`或`$`一起使用，初始化时 `attributes` 带上 `m` 即可，**注意，加上它并不代表 `.` 就可以匹配 `\n`，JavaScript没有这个功能;但可以伪造出来，如用`[\s\S]`或`[^]`**
* `lastIndex`: 上一次匹配到的索引，在__非__`global`模式下返回的都是0，否则返回的是当前这此匹配完成后的下一个字符的索引。**另外，这个属性是可以人工修改的**
		
		var str = 'abc';
		var reg = /b/;
		reg.test(str);
		console.log(reg.lastIndex === 0);
		
		var str = 'abab';
		var reg = /b/g;
		reg.test(str);
		console.log(reg.lastIndex === 2);
		reg.test(str);
		console.log(reg.lastIndex === 4);
		console.log(reg.test(str) === false);

* `source`: 返回初始化时的 `pattern`，如果是通过字面量定义的，则返回的是去掉分界符(`/` 与 `/`)及所有`attributes`的的字符串
 		
 		var reg = /cde/i;
 		console.log(reg.source === 'cde');
 		
 		var reg = /(\\s).+?[abc]/;
 		console.log(reg.source === '(\\\\s).+?[abc]'); // 注意后面是四条 \
		

## 实例变量的方法


* `test`：返回的是一个真假值，它会将它匹配到括号内的值写入到全局变量 `RegExp`中，所以可以通过 `RegExp.$1`, `RegExp.$2` ... 去访问第n个匹配
* `exec`：返回的是一个数组，`[matchedText, $1, $2 ...]`，**另外，返回的数组还有两个属性：`input` 和 `index`，分别表示`输入的字符串`和`当前匹配的第一个索引`**，它也会将匹配的值写入全局的 `RegExp` 变量。

**RegExp.exec 与 String.match 对比:**

* 非 `global` 匹配: `str.match(reg)` 和 `reg.exec(str)` 返回的结果是一样的，都是一个数组，只不过`reg.exec(str)`返回的数组还有`input`和`index`两个属性
* `global`匹配: `str.match(reg)` 返回的所有匹配到的字符串，它会忽略正则中的括号；而 `reg.exec(str)` 返回的是一次匹配的值，并包括括号中的匹配，还有`input`和`index`两属性，同时你可以连续调用 `exec`，它会继续向后匹配，直到其返回 `null`。
		
		// no global 模式
		var reg = /(a)(b|c)?(d)/;
		var str = 'ad';
		var execRtn = reg.exec(str);
		var matchRtn = str.match(reg);
		console.log(execRtn.length === 4);
		console.log(execRtn.index === 0 && execRtn.input === 'ad');
		
		// 注意没匹配到的值在全局变量 和 在返回值中是不一样的
		console.log(RegExp.$2 === '');
		console.log(execRtn[2] === undefined);
		
		console.log(matchRtn.length === 4);
		
		
		// global 模式
		var reg = /a([bd])/g;
		var str = 'adcab';
	
		var matchRtn = str.match(reg);
		console.log(matchRtn.length === 2 && matchRtn[0] === 'ad');
		
		var execRtn = reg.exec(str);
		console.log(execRtn[0] === 'ad' && execRtn[1] === 'd');
		execRtn = reg.exec(str);
		console.log(execRtn[0] === 'ab' && execRtn[1] === 'b');
		console.log(reg.exec(str) === null);
		

## 技巧

### 注意的几点

* `\w` => `[a-zA-Z_0-9]`，不包括中划线 `-`
* `\s` => `[ \t\r\n\f\v...]`
* `\b` => 匹配单词的边界，即`[a-zA-Z_0-9]`之外的字符的边界，它不匹配字符，所以没有宽度
* **`/(["'])([^\1]*)]\1/.exec('"a\\"a"')` 为什么能匹配成功(`[]`中的`\1`只代表普通的`1`而已)？ => 用 `/(["'])([^\\\n]*?[^\\])(\1)/` 或 `/(["'])(?:(\\.|[^\\\n])*)(\1)/`** 
* **实现`String.lastSearch`，返回匹配的字符串最后一次出现的位置**
* **实现`String.reverseSearch`,反向查找匹配的字符串第一次出现的位置**
* `?`放在 `()` 后面很容易出现 `undefined`，解决方法 `((?:exp)?)`
* 如果匹配的内容包含换行符时，而它又不在开头或结尾，这时加`m`参数基本上没用，且用`[.\n]*`也没用时，可以试下`[\s\S]*`

### 反向引用

		/^(["'])([^\1]*)\1$/.test('"abc"');
		console.log(RegExp.$1 === '"');
		console.log(RegExp.$2 === 'abc');
		
### 非捕获性分组

		/(?:a)\s(b)/.test('a b');
		console.log(RegExp.$1 === 'b')

### 前瞻

* `(?=exp)`: 匹配后面出现 `exp`
* `(?!exp)`: 匹配后面不出现 `exp`

		console.log(/a(?=b)/.test('ab') === true);
		console.log(/a(?!b)/.test('ab') === false);


### String.match 方法（参见RegExp.exec方法）
### String.replace(regexp, replacement) 方法
* `replacement`为字符串时: 

可以使用下面的字符来表示特定的匹配，为了避免歧义，常把它们放在`{}`内

Characters        | Replacement
-----------       | -------------
$1,$2,...$99      | 匹配结果中对应的分组匹配结果
$&                | 与正则相匹配的字符串
$`                | 匹配字符串左边的字符
$'                | 匹配字符串右边的字符


* `replacement`为函数时: 此函数的参数对应的分别是 `$&,$1,$2,...,index,input`

### String.search(regexp)方法
* 函数返回第一次匹配到的字符串的位置


### 参考
* [MDN RegExp][mdn]
* [司徒正美：javascript正则表达式（讲解了一些基本知识）][1]
* [前端乱炖: JS下的正则表达式（JS正则的回溯机制耗费性能分析 => 降低正则复杂度，尽量用JS去分析匹配后的字符串）][2]
* [小胡子哥：正则表达式30分钟入门][3]
* [小胡子哥：正则表达示进阶][4]

[1]: http://www.cnblogs.com/rubylouvre/archive/2010/03/09/1681222.html
[2]: http://www.html-js.com/article/1275
[3]: http://www.cnblogs.com/hustskyking/archive/2013/06/04/RegExp.html
[4]: http://www.cnblogs.com/hustskyking/p/how-regular-expressions-work.html
[mdn]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp 




