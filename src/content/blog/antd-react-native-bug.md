---
author: dinger
pubDatetime: 2022-12-28T04:59:04.866Z
title: reactnative antd事件处理写在render中导致的bug
slug: reactnative antd事件处理写在render中导致的bug
featured: false
draft: false
tags:
  - docs
  - release
description: New feature in AstroPaper v1.4.0, introducing dynamic OG image generation for blog posts.
---

New feature in AstroPaper v1.4.0, introducing dynamic OG image generation for blog posts.

## Table of contents

## 问题
由于在render时修改了props中传进来的actions中的button的onPress，导致第二次render时promise变成非promise。所以如果在alert显示期间，有事件触发导致重新render，就会有问题，无法阻止关闭
https://github.com/ant-design/ant-design-mobile-rn/blob/2.x/components/modal/AlertContainer.native.tsx

``` javascript
{
key: 'render',
value: function render() {
    var _this2 = this;

    var _props = this.props,
        title = _props.title,
        actions = _props.actions,
        content = _props.content,
        onAnimationEnd = _props.onAnimationEnd;

    var footer = actions.map(function (button) {
        // tslint:disable-next-line:only-arrow-functions
        var orginPress = button.onPress || function xxx () {};
        button.onPress = function () {
            var res = orginPress();
            if (res && res.then) {
                res.then(function () {
                    _this2.onClose();
                });
            } else {
                _this2.onClose();
            }
        };
        return button;
    });
```

由于业务代码不确定能不能改，这是个路由的hook，改了一个页面也其他页面也不一定好用

### 方案1:

在空闲时调用，尝试runAfterInteractions，不行。业务中第二个接口调用的时间有点长，已经超出这个范围了
``` javascript
 InteractionManager.runAfterInteractions(() => {

	console.log('动画结束了');

});
```

### 方案2:

第二次渲染时如何恢复button或者onPress事件
重写按钮的onPress的setter和getter，第一次getter返回真实的事件，之后调用都返回antd的事件

``` javascript
let firstV = () => {};
Object.defineProperty(buttons[0], 'onPress', {
  set(v) {
	if (setterCallCount > 1) {
	  return;
	}
	setterCallCount = setterCallCount + 1;
	firstV = v;
  },
  get() {
	if (setterCallCount === 1) {
	  return onPress;
	}
	return firstV;
  },
});
```
### TODO：

下一个问题，没有props的修改，为什么会触发重新render

