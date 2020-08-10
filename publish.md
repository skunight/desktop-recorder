
### 软件最终展示样子
![](https://user-gold-cdn.xitu.io/2020/6/20/172cf0f180f93da9?w=650&h=478&f=png&s=314391)

### 功能介绍
- 屏幕预览
- 录屏
- 截图
- 可开启关闭麦克风
- 可开关预览的声音

### 简介

该软件基于Electron实现客户端。页面用Vue实现。

Github地址:[https://github.com/skunight/desktop-recorder](https://github.com/skunight/desktop-recorder)。

并且在B站做了视频教程[https://www.bilibili.com/video/BV1C5411W7uF/](https://www.bilibili.com/video/BV1C5411W7uF/)

欢迎大家Star

### 技术要点

- 用Electron的desktopCapturer获取到桌面
- 用navigator.mediaDevices.enumerateDevices获取到输入设备
- 用navigator.mediaDevices.getUserMedia获取到媒体流
- 用MediaRecorder获取Blob
- 用FileReader读取Blob
- 用Electron的app.getPath('userData')获取用户目录
- 用fs写入文件
- 用Electron的ipcMain,ipcRenderer实现主进程和渲染进程交互数据
- 用canvas对video进行截图