# Agent Reach (69k Stars 全网社媒与内容生态连接器实战指南)

> **核心作用**：让 AI Agent 获得一键检索并读取主流中英文互联网内容平台的能力，包括 **B站（哔哩哔哩）、小红书、微信公众号、抖音、小宇宙播客、雪球、Twitter/X、Reddit、YouTube 字幕** 等 15+ 渠道。

---

## 一、 已支持的 15 大核心平台矩阵

| 平台分类 | 核心支持平台 | 提取能力与输出格式 |
|---|---|---|
| **国内视频与社区** | **B站 (Bilibili)** | 视频搜索、BV号视频详情、分P字幕提取、热门排行榜； |
| **生活与图文分享** | **小红书 (Xiaohongshu)** | 笔记正文、图片列表、用户主页、互动评论区； |
| **深度长文与资讯** | **微信公众号 / 任意网页** | Jina Reader / 微信文章正文 Markdown 提取、去广告正文解析； |
| **播客与音频转录** | **小宇宙 (Xiaoyuzhou)** | 播客音频自动流式下载 + Whisper 语音转录中文文本； |
| **金融与技术社区** | **雪球 / V2EX / GitHub** | 股票研报与社区讨论、V2EX 节点主题、GitHub 代码/PR/Issue； |
| **海外主流社媒** | **Twitter/X / Reddit / YouTube** | 推文线索 (Threads)、Subreddit 帖子、YouTube 视频字幕与章节。 |

---

## 二、 本地实操常用命令

当孙承泽将本仓库 pull 到本地电脑后（具备国内本地网络与常用浏览器 Cookie），可直接在终端使用已配置好的 `agent-reach`：

```bash
# 1. 运行平台诊断
agent-reach doctor

# 2. 从本地 Chrome / Edge 自动提取已登录平台的 Cookie（免密接入）
agent-reach configure --browser=chrome

# 3. 检索 B站 风电场偏航优化相关视频与字幕
agent-reach skill search bilibili "风电场偏航优化"

# 4. 检索 小红书 科研 PPT 与答辩排版技巧
agent-reach skill search xiaohongshu "挑战杯答辩PPT排版"

# 5. 小宇宙播客链接一键转文字
agent-reach transcribe "https://www.xiaoyuzhoufm.com/episode/..."
```

---

## 三、 在本项目大创答辩中的协作定位

1. **学术与前沿动向追踪**：一键搜索 B站/微信公众号上各大风电主机厂（金风科技、远景能源、明阳智能）关于“尾流偏航协同控制与激光雷达测风”的最新实测案例；
2. **多模态调研素材沉淀**：自动抓取行业公开研报与讲解视频字幕，丰富答辩背景支撑；
3. **安全与隐私保障**：Agent Reach 采用本地隔离沙箱与凭据脱敏设计，绝不会向第三方泄露用户本地 Cookie。
