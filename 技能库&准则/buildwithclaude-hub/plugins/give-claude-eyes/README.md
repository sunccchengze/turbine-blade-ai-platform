# Give Claude Eyes

### Multimodal video & image understanding via Qwen Omni

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code%20%2F%20Cowork-blueviolet)](https://claude.ai)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)

Claude can't natively watch video. This plugin fixes that -- it bridges Claude with [Qwen Omni](https://help.aliyun.com/zh/model-studio/developer-reference/qwen-omni), a natively multimodal model that actually sees motion, not just individual frames. When you mention a video or ask for visual analysis, Claude calls Qwen under the hood and works with the result. For you as the user, it just feels like Claude can see.

```
You --> Claude --> Qwen Omni API --> Claude --> You
         "analyze this video"    (watches it)   "here's what I saw"
```

## Quick start

### Install

**Claude Code:**

```bash
claude plugin add kirillbrsnkv/give-claude-eyes
```

**Cowork:** Download [`give-claude-eyes.plugin`](https://github.com/kirillbrsnkv/give-claude-eyes/releases/latest) from Releases and drag it into Cowork.

### Set up your API key

Get a key at [Alibaba Model Studio](https://modelstudio.console.alibabacloud.com/) (international) or [DashScope](https://dashscope.console.aliyun.com/) (China mainland), then:

```bash
# macOS / Linux -- add to ~/.bashrc or ~/.zshrc to persist
export DASHSCOPE_API_KEY=sk-your-key-here

# Windows PowerShell
$env:DASHSCOPE_API_KEY = "sk-your-key-here"
```

### Verify

```
/qwen-setup
```

### Use

```
/analyze-video path/to/video.mp4 Describe the character's body movement
```

Or just talk naturally -- the skill triggers automatically when you mention video analysis.

## What you can do

**Single video analysis** -- motion breakdown, composition, lighting, quality assessment, whatever you ask:

```
/analyze-video clip.mp4 Analyze the camera movement and lighting setup
```

**Batch classification** -- point Claude at a folder and it writes a script to classify every file:

```
"I have 30 animation references in ./refs/ -- classify each by animation state (idle, talking, thinking)"
```

**Multi-turn** -- ask follow-up questions about the same video:

```
"Now tell me more about the hand movement in the second half"
```

**Image analysis** -- works with screenshots, diagrams, reference images too:

```
/analyze-video screenshot.png What UI elements are visible here?
```

## Commands

| Command | What it does |
|---------|-------------|
| `/analyze-video [file] [prompt]` | Analyze a video or image file |
| `/qwen-setup` | Check dependencies and verify API connection |

## Configuration

### Models

Default model is `qwen-omni-plus-latest`. Tell Claude to use a different one, or pass `--model`:

| Model | Best for |
|-------|----------|
| `qwen-omni-plus-latest` | Video + audio + image, best quality |
| `qwen-omni-turbo-latest` | Faster and cheaper, good for most tasks |
| `qwen-vl-max` | Image-only, strongest image understanding |
| `qwen-vl-plus` | Image-only, good cost/quality balance |

Check the [model docs](https://help.aliyun.com/zh/model-studio/developer-reference/qwen-omni) for the current list.

### Region

International (Singapore) endpoint is used by default. China mainland users: pass `--region cn`.

### FPS

Video frames are sampled at 2 FPS by default. Lower it for long videos or to save costs:

```bash
--fps 1    # good enough for most analysis
--fps 0.5  # very long videos (minutes+)
```

## Supported formats

**Video:** mp4, mov, avi, mkv, webm, flv, wmv

**Image:** png, jpg, jpeg, gif, webp, bmp, tiff

## API costs

Qwen Omni pricing is token-based. A 5-second video at 2 FPS costs roughly 2000-3000 input tokens. See [current pricing](https://help.aliyun.com/zh/model-studio/billing-for-model-studio).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `DASHSCOPE_API_KEY not set` | Set the env variable, run `/qwen-setup` |
| `dashscope not installed` | `pip install dashscope` |
| `401 Unauthorized` | Invalid or expired API key |
| `429 Too Many Requests` | Rate limited, wait and retry |
| `File not found` | Check the path, use absolute paths |
| `Unsupported file type` | Only video/image formats listed above |
| Connection error | Check network; try `--region cn` if in China |
| Timeout on large video | Lower FPS with `--fps 1` or `--fps 0.5` |

## Requirements

- Python 3.9+
- `dashscope` package (`pip install dashscope`)
- `DASHSCOPE_API_KEY` environment variable

## License

MIT
