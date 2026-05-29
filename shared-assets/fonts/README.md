# Fonts

`latin-modern/` 下的小体积 Latin Modern 字体保存在仓库中。

`noto/` 下的 Noto CJK 字体体积较大，仓库不保存这些文件。主题 CSS 只会按字体栈查找本机 `Noto ... CJK SC` 字体，不会从 COS 远程加载中文字体；PDF 渲染时如果本机没有这些字体，会继续使用系统 fallback。需要手动下载或核对 Noto CJK 文件时，使用下面的 COS 地址：

```text
https://heaticy-1310163554.cos.ap-shanghai.myqcloud.com/vsp-marp/assets/fonts/noto/
```

当前主题引用的 Noto CJK 文件包括：

```text
NotoSerifCJKsc-Regular.otf
NotoSerifCJKsc-Bold.otf
NotoSansCJKsc-Regular.otf
NotoSansCJKsc-Bold.otf
NotoSansMonoCJKsc-Regular.otf
NotoSansMonoCJKsc-Bold.otf
```
