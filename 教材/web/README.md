# 本地学习站

双击 `教材/打开学习站.bat`，或用浏览器打开本目录的 `index.html`。

- 不需要 npm / Node。
- 公式用 CDN 上的 KaTeX，需要能上网。
- 「已掌握」存在浏览器 localStorage，清缓存会丢。
- 答案已按 `evidence/` 与 `教材配套答案详解.md` 对齐。

改了教材 md 之后，在仓库根目录执行：

```bat
python 教材\web\build_local.py
```
