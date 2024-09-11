---
author: dinger
pubDatetime: 2024-09-11 21:55:17
modDatetime: 2024-09-11 21:55:17
title: clash-for-wondows 在 mac 的 ssidStrategy 功能修复
slug: clash-for-wondows在mac的ssidStrategy功能修复
featured: false
draft: false
tags:
  - cfw
description: clash-for-wondows在 mac 的 ssidStrategy 功能修复
---

# clash-for-wondows的ssidStrategy功能修复

## 需求

根据 wifi 切换 cfw 的 mixin 配置，在家自动开启 mixin，在公司自动关闭 mixin。
无缝连接公司内网，用docker把easyconnect封印在家里的nas。在 cfw 中配置了 mixin 脚本，增加对应的规则。

在家里使用mixin添加公司内网的dns和规则，在公司网络不需要开启mixin，所以期望能根据wifi动态切换mixin的开关

## 分析

首先cfw本身是支持这个需求的，`SSID Strategy`。但是在新版本的 mac 上有问题。

## 排查过程

mixin 不是 clash 的标准，是 cfw 的功能，所有不能通过 clash 的 api 操作
查看 cfw 的源码

cfw 是 electron 打包的，所以找到目录解开 asar 看看
这个目录

```
/Applications/Clash for Windows.app/Contents/Resources/app.asar
```

解压asar

```bash
asar extract app.asar ./
```

之后在dist目录中，找到render.js，格式化一下看源码

```javascript
{setSSIDOptions: function () {
                var e = this
                return d()(
                  u().mark(function t() {
                    var i, n, o, s, r, a, l, c, h
                    return u().wrap(
                      function (t) {
                        for (;;)
                          switch ((t.prev = t.next)) {
                            case 0:
                              if (
                                ((i = (function () {
                                  var t = d()(
                                    u().mark(function t() {
                                      var i, n, o
                                      return u().wrap(function (t) {
                                        for (;;)
                                          switch ((t.prev = t.next)) {
                                            case 0:
                                              return (
                                                (i = _.Z.get(W.Z.IS_MIXIN) || !1),
                                                (n = _.Z.get(W.Z.IS_TUN) || !1),
                                                (o = _.Z.get(W.Z.SYSTEM_PROXY) || !1),
                                                e.changeIsMixinEnable({ isMixin: i }),
                                                e.chagneIsTunEnable({ isTun: n }),
                                                (t.next = 7),
                                                e.$setSystemProxy(o, e.confData)
                                              )
                                            case 7:
                                              if (!t.sent) {
                                                t.next = 9
                                                break
                                              }
                                              e.setIsSystemProxyOn({ isOn: o })
                                            case 9:
                                            case 'end':
                                              return t.stop()
                                          }
                                      }, t)
                                    })
                                  )
                                  return function () {
                                    return t.apply(this, arguments)
                                  }
                                })()),
                                (t.prev = 1),
                                e.setMatchedSSID({ ssid: '' }),
                                (n = (0, Ee.S)() || []),
                                (o = e.settings.ssidStrategyText),
                                (s = le().parse(o).strategy),
                                ee.info(JSON.stringify({ conns: n, ssidStrategy: s }, null, 2)),
                                !(r = n.find(function (e) {
                                  return e.SSID in s
                                })))
                              ) {
                                t.next = 24
                                break
                              }
                              if ((e.setMatchedSSID({ ssid: r.SSID }), !(a = s[r.SSID]))) {
                                t.next = 22
                                break
                              }
                              if (
                                ((l = a.system),
                                (c = a.tun),
                                'boolean' == typeof (h = a.mixin) && e.changeIsMixinEnable({ isMixin: h }),
                                'boolean' == typeof c && e.chagneIsTunEnable({ isTun: c }),
                                (t.t0 = 'boolean' == typeof l),
                                !t.t0)
                              ) {
                                t.next = 20
                                break
                              }
                              return (t.next = 19), e.$setSystemProxy(l, e.confData)
                            case 19:
                              t.t0 = t.sent
                            case 20:
                              if (!t.t0) {
                                t.next = 22
                                break
                              }
                              e.setIsSystemProxyOn({ isOn: l })
                            case 22:
                              t.next = 25
                              break
                            case 24:
                              i()
                            case 25:
                              t.next = 30
                              break
                            case 27:
                              ;(t.prev = 27), (t.t1 = t.catch(1)), ee.error('failed to set ssid options: '.concat(t.t1))
                            case 30:
                              return (t.prev = 30), t.finish(30)
                            case 32:
                            case 'end':
                              return t.stop()
                          }
                      },
                      t,
                      null,
                      [[1, 27, 30, 32]]
                    )
                  })
                )()
              }}
```

成功和失败都有log，一开始没反应过来这个日志应该在哪

找了以下几个地方
1. cfw 应用内的 log，没有
2. 配置目录下的 logs 目录 `/Users/dingjz/.config/clash/logs`，也没有
3. 系统的 console，也没有
4. 打开应用的 devtools ，在这里

![log](@assets/images/image.png)
``` json
{
  "conns": [
    {
      "WARNING": "The airport command line tool is deprecated and will be removed in a future release."
    }
  ],
  "ssidStrategy": {
    "CSX_Office": {
      "mixin": false
    },
    "CSX_Guest": {
      "mixin": true
    },
    "CMCC-cU7f": {
      "mixin": true
    },
    "CMCC-cU7f-5G-FAST": {
      "mixin": true
    }
  }
}
```

原来，获取ssid失败了，可以看到使用airport工具，这工具要弃用了

在render的代码里搜一下airport，可以看到用这个命令来获取信息
``` javascript
t = (0, r.Kr)()
                ? 'chcp 65001 && netsh wlan show interfaces'
                : '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport --getinfo',
              i = (0, s.execSync)(t).toString().split('\n'),
```

其实只要模拟一个命令获取当前的ssid就行
直接修改命令：

```
echo 'SSID: '$(networksetup -getairportnetwork en0 | awk -F': ' '{print $2}')
```

重新打包
```
asar p ./ app.asar
```

重启 cfw，可以看到页面上已经显示了
![success](@assets/images/image-1.png)

测试一下切换 wifi，功能正常

搞定!

题外话
过程中还搜到一个有趣的issue
https://github.com/clash-verge-rev/clash-verge-rev/issues/1231


