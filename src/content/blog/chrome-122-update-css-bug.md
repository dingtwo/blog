---
author: dinger
pubDatetime: 2024-08-05 16:44:14
modDatetime: 2024-08-14 11:42:02
title: chrome升级带来的样式变化
slug: chrome升级带来的样式变化
featured: false
draft: false
tags:
  - bug
  - css
  - chrome
description: 一个bug的修复过程
---

记一个不规范的写法导致的bug

## Table of contents

## 场景

某天有人找我，说我们内部用的一个页面样式发生了变化，找了个测试确认一下没修改后就给他经典回复“我这是好的呀”
后来反馈的人又来了一个，开始研究。

## 结论

chrome 122 版本对 rgb 的值更宽容了，之前不生效的样式现在生效了

## 分析

代码里写的```
``` css
  box-shadow: 0 0 5px 0 rgb(128 145 165 / 20%);
```

根据 mdn 的描述，rgb 本身是支持这个语法的
由于使用了 less，less 中有个 [math](https://lesscss.org/usage/#less-options-math)的 参数，有四个选项
- `always` (3.x default) - Less does math eagerly
- `parens-division` **(4.0 default)** - No division is performed outside of parens using `/` operator (but can be "forced" outside of parens with `./` operator - `./` is deprecated)
- `parens` | `strict` - Parens required for all math expressions.
- `strict-legacy` (removed in 4.0) - In some cases, math will not be evaluated if any part of the expression cannot be evaluated.
项目里用的是 3.x 版本，默认会对`/`做计算，最终结果如下
``` css
box-shadow: 0 0 5px 0 rgb(128 145 8.25%)
```

chrome 122之前的版本识别为无效的样式
更新之后，识别为
``` css
box-shadow: 0 0 5px 0 rgb(128 145 8.25)
```

有空再看Chromium那边改了什么

``` c
// https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/css/cssom/css_rgb.cc;l=54;bpv=0;bpt=1
void CSSRGB::setB(const V8CSSNumberish* blue, ExceptionState& exception_state) {
  if (auto* value = ToNumberOrPercentage(blue)) {
    b_ = value;
  } else {
    exception_state.ThrowTypeError(
        "Color channel must be interpretable as a number or a percentage.");
  }
}
```