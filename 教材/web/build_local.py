#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build local-openable HTML study pages from 教材/*.md + 答案详解."""
from __future__ import annotations

import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = Path(__file__).resolve().parent

UNITS = [
    ("U01", "U01-红线与证据等级.md", "红线与证据等级"),
    ("U02", "U02-级与三个气动输出.md", "级与三个气动输出"),
    ("U03", "U03-相对运动与欧拉做功.md", "相对运动与欧拉做功"),
    ("U04", "U04-激波附面层与Rotor37.md", "激波、附面层与 Rotor 37"),
    ("U05", "U05-RANS网格与残差收敛.md", "RANS、网格与残差收敛"),
    ("U06", "U06-从三万点到74维.md", "从三万点到 74 维"),
    ("U07", "U07-残差代理与损失.md", "残差代理与损失"),
    ("U08", "U08-R2划分与优化不可靠.md", "R²、划分与优化不可靠"),
    ("U09", "U09-MC-Dropout拆解.md", "MC Dropout 拆解"),
    ("U10", "U10-覆盖率与保形加宽.md", "覆盖率与保形加宽"),
    ("U11", "U11-Pareto与数不是叶子.md", "Pareto 与数不是叶子"),
    ("U12", "U12-Level2与郭老师线.md", "Level 2 与郭老师线"),
]

DIFF = {"易": "easy", "中": "medium", "难": "hard"}
KIND = {"选": "choice", "填": "fill", "问": "short"}

# Frozen evidence — never contradict these.
FROZEN = {
    "r2": "0.9844 / 0.9561 / 0.9827",
    "eta_max": "0.9173",
    "mdot_max": "21.74",
    "eta_at_mdot": "0.873",
    "cover": "0.89 / 0.65 / 0.88",
    "relrms": "−3.39",
}

# Hard overrides: official answers + explanations (correct the uploaded demo).
OVERRIDE = {
    "U01-S1-Q01": ("C", "没有 E4 数字。decision_metrics 全是 null。−3.39 只是 E3，未收敛。"),
    "U01-S1-Q02": ("C", "留出集 R² 属于 E2（代理/统计），不是收敛 RANS。"),
    "U01-S1-Q03": ("evidence/", "公开数字只出自 evidence/。"),
    "U01-S1-Q04": ("−3.39；false", "粗网格 relrms=−3.39，converged=false。"),
    "U01-S1-Q05": ("跑过 ≠ 残差到阈值。−3.39 是平台，converged=false，只能当 E3 趋势，不能当 E4。", ""),
    "U01-S1-Q06": ("不是一套。官方 test 200 组标签隐藏，无法算 R²。本项目 R² 来自随机留出 n=100、seed=42。", ""),
    "U01-S1-Q07": ("不能。规划是 E0，不产生冻结数字。", ""),
    "U01-S1-Q08": ("E2：代理相对训练均值 +5.4%。假 E4：写成 CFD 证实效率提高 5.4%。", ""),
    "U01-S1-Q09": ("单一事实源，避免网站、信、README 各写一套数。", ""),
    "U01-S1-Q10": ("①残差未到 −6；②一阶耗散大；③细网格没跑完。改名会诱使把趋势当验证。", ""),
    "U01-S2-Q01": ("B", "对外名称是气动代理筛选站。结构/热未接，不能叫 MDO。"),
    "U01-S2-Q02": ("C", "C 带「未收敛」，是合规 E3。A/B/D 都在禁词表。"),
    "U01-S2-Q03": ("65", "η 经验覆盖率 65%，名义 95%，未校准。"),
    "U01-S2-Q04": ("引子", "KIT 303 秒是行业引子，对象是 Rotor 37。"),
    "U01-S2-Q05": ("不可以。只有 status: verified 才能对外写。", ""),
    "U01-S2-Q06": ("没有。定音需要收敛 RANS。", ""),
    "U01-S2-Q07": ("至少两处：不是真实几何；没有收敛 RANS，不能叫最优可制造叶片。", ""),
    "U01-S2-Q08": ("给郭老师的信不点宋老师。", "纪律是不点名，不是「经本人同意再点」。"),
    "U01-S2-Q09": ("改为：在 74 维特征空间里做了气动代理筛选。74 维不是设计空间，也还不是 MDO。", ""),
    "U01-S2-Q10": ("错句：「找到最优叶片。」改正：「代理筛出最高效率候选 0.9173，未用收敛 RANS 核。」", ""),
    "U01-S3-Q01": ("C", "NASA Rotor 37 是跨音速压气机转子，不是涡轮。"),
    "U01-S3-Q02": ("B", "生成页是库内近邻检索，不是扩散长新叶。"),
    "U01-S3-Q03": ("预计算常数 σ", "生产 API 不是实时 100 次 Dropout。"),
    "U01-S3-Q04": ("阈值", "E3/E4 分界是残差有没有到收敛阈值，不是求解器有没有启动。"),
    "U01-S3-Q05": ("「代理」和「相对训练均值」（或「不是 CFD 叶片」）。", ""),
    "U01-S3-Q06": ("没有收敛 RANS 对照，禁止用代理自比填决策指标。", ""),
    "U01-S3-Q07": ("违规。损失只有输出边界 ReLU²，没有把 N-S 残差写进损失，不是 PINN。", ""),
    "U01-S3-Q08": ("三个输出都是气动标量，结构/热/振动都没接。", ""),
    "U01-S3-Q09": ("融合 R² 区间；conformal 93.5–96.5%；100,000×（不含离线 1000 组 CFD）。", ""),
    "U01-S3-Q10": ("没有做完。只在特征空间用代理做了多目标筛选；没有可加工几何，也没有收敛 RANS。", ""),
    "U01-E-Q01": ("C", "E2 = 代理/统计。"),
    "U01-E-Q02": ("B", "决策指标全部 null。"),
    "U01-E-Q03": ("B", "官方 test 标签隐藏，算不出 R²。"),
    "U01-E-Q04": ("B", "压气机转子。"),
    "U01-E-Q05": ("B", "预计算常数 σ。"),
    "U01-E-Q06": ("B", "库内近邻检索。"),
    "U01-E-Q07": ("0.9844 / 0.9561 / 0.9827", "冻住的是这三数，不是 0.9608 / 0.9777。"),
    "U01-E-Q08": ("−3.39；否", ""),
    "U01-E-Q09": ("气动代理筛选站", ""),
    "U01-E-Q10": ("未收敛", "E3 三件套：粗网格 / 一阶 / 未收敛。"),
    "U01-E-Q11": ("π、η、ṁ", ""),
    "U01-E-Q12": ("65；95", ""),
    "U01-E-Q13": ("划分不同；官方无标签，holdout 才是本项目 R² 口径。", ""),
    "U01-E-Q14": ("代理；相对训练均值；不是 CFD 叶片。", ""),
    "U01-E-Q15": ("一个是代理相对训练均值，一个是 CFD 核过的增益，证据档不同，不能比大小。", ""),
    "U01-E-Q16": ("C06：74 维是表面统计量，不是可设计几何。C07：三个输出均为气动标量，故不称 MDO。", ""),
    "U01-E-Q17": ("指输出盒子 ReLU² 惩罚。不指 N-S 残差，不是 PINN。", ""),
    "U01-E-Q18": ("写单点毫秒，并声明不含离线 1000 组 CFD。不要把 100,000× 当冻结结论。", ""),
    "U01-E-Q19": ("可以引用郭老师 2025 TNO。不能写「我做了 TNO」。", ""),
    "U01-E-Q20": ("缺「示意，不是这个向量反解的 CAD」。", ""),
    "U01-E-Q21": ("特征→几何一般不可逆。", ""),
    "U01-E-Q22": ("没有扫完整特性/非设计点。", ""),
    "U01-E-Q23": ("读原始输出和日志，不读作者摘要。", ""),
    "U01-E-Q24": ("seed、pymoo 0.6.1、numpy/onnxruntime 锁版、同脚本。", ""),
    "U01-E-Q25": ("「一半」暗示 E4 进度。粗网格未收敛不是闭环的一半。", ""),
    "U01-E-Q26": ("覆盖率是区间命中率，不是模型总分。", ""),
    "U01-E-Q27": ("MC 估计量收敛；覆盖率校准收敛。", ""),
    "U01-E-Q28": ("自拟。须能抓住「代理结果冒充 CFD 验证」。", ""),
    "U01-E-Q29": ("必须看见：HERE 在标量筛选；η 覆盖 65%；−3.39 未收敛。有害：100,000× 当贡献；多学科；可制造最优。", ""),
    "U01-E-Q30": ("现在是 E2。缺 CST/FFD、收敛 RANS 对照、校准加点、决策指标、非设计点或缩结论。", ""),
    "A01": ("B", "跨音速压气机转子，不是涡轮。"),
    "A02": ("B", "冻住 η 的 R² 是 0.9561。0.9173 是代理最高效率，不是 R²。"),
    "A03": ("C", "Ĉ_η=0.65。"),
    "A04": ("B", "未收敛，E3。"),
    "A05": ("B", "气动代理筛选站。"),
    "A06": ("B", "决策指标全部 null。"),
    "A07": ("B", "P 是背压，不是进口总压。"),
    "A08": ("B", "生产端预计算常数 σ。"),
    "A09": ("π、η、ṁ", "三个气动输出。"),
    "A10": ("9×8", "9 组表面场量 × 8 个统计量 + Ω + P，不是 9 个截面。"),
    "A11": ("rad/s", ""),
    "A12": ("1.48", "公开基准设计值，不是我们的 E4。"),
    "A13": ("方差", "八个数里是 std。"),
    "A14": ("1.96", ""),
    "A15": ("加宽", "教材里 q>1.96 指保形把 1.96 换成更大的分位数 q，叫加宽。不是「离群」这个叫法。"),
    "A16": ("21.74；0.873", "冻住的是 21.74 kg/s @ η≈0.873，不是 20.93/0.842。"),
    "A17": ("把气等熵刹到静止，压力变成总压；静压是当地热力学压力。", ""),
    "A18": ("实际有损失，焓升更大；热力学第二定律禁止 η>1。", ""),
    "A19": ("小于 1。", ""),
    "A20": ("壁面速度为 0。", ""),
    "A21": ("相邻叶片通道最窄截面。", ""),
    "A22": ("MC 估计量：T=100 够稳。覆盖率校准：η 只有 65%。RANS 残差：−3.39 未收敛。", ""),
    "A23": ("偏度是全局一个数，不含激波弦向/叶高位置。", ""),
    "A24": ("学增量 F(x)；捷径让梯度抄近路，最差退成恒等。", ""),
    "A25": ("PINN 要把 PDE 残差写进损失。本项目只有输出边界 ReLU²，不是 PINN。", ""),
    "A26": ("R² 是平均拟合。优化往流形边上走，排序可以对错。没有收敛 CFD，优化不可靠。", ""),
    "A27": ("Pareto 到训练集最近邻中位距离约 17.4，训练集内部约 6.1，约 3×。不是「欧氏 vs 测地」那套空讲。", ""),
    "A28": ("激活，不是把权重从磁盘删掉。", ""),
    "A29": ("Ĉ=(1/N)Σ 1{y_i ∈ [μ_i±1.96σ_i]}。", ""),
    "A30": ("不补激波物理、不补点排序（r≈0.027）、不保证分布漂移（Pareto 3×）下仍覆盖。", ""),
    "A31": ("代理；相对训练均值；不是 CFD 叶片。", ""),
    "A32": ("示意重构，不是 CAD。", ""),
    "A33": ("只有气动标量，结构/热没接。", ""),
    "A34": ("①真实几何旋钮 CST/FFD；②Top-k 收敛 RANS 与排名对比；③一次主动学习或 abstain。", ""),
    "A35": ("2018 SMO：与 Haftka 的多保真选数据集。2025 TNO：Rotor 37 子午面先报 T,p,ρ 再报性能。", ""),
    "A36": ("改为：名义 95% 启发式带，η 经验覆盖约 65%，未校准。", ""),
    "A37": ("Dropout 改的是有效权重；65% 是覆盖率不是分数；保形用 q 加宽区间，不补激波物理。", ""),
    "A38": ("不是。0.9173 是特征空间里代理吐的数；没有 CST/FFD，也没有收敛 RANS。", ""),
    "A39": ("[E1] 74 维丢掉激波位置 → [E1] 多对一 → [E2] 平滑网贴间断、σ 偏小 → [E2] Ĉ_η=0.65。", ""),
    "A40": ("高 η 低 σ / 高 η 高 σ / 普通对照。能填很糙的 Spearman/Top-k；无收敛前 HV/Budget 仍空。", ""),
    "B01": ("C", "带标签约 1000 组。"),
    "B02": ("B", "w=(1,3,1.5)。"),
    "B03": ("B", "锁版 0.9173，不用 0.9212。"),
    "B04": ("B", "0.89 与 0.88。"),
    "B05": ("B", "约 14 万。"),
    "B06": ("B", "2.11 MB。"),
    "B07": ("B", "200 代 / 种群 100。"),
    "B08": ("B", "库内检索。"),
    "B09": ("std", ""),
    "B10": ("523011", ""),
    "B11": ("0.2857", ""),
    "B12": ("失速", ""),
    "B13": ("盒子", ""),
    "B14": ("附面层", ""),
    "B15": ("0.1", "SE≈σ/√100=0.1σ。"),
    "B16": ("93.5–96.5", "未冻结，不得对外当结论。"),
}


def parse_obj_key(text: str) -> dict[str, str]:
    """Parse 客观题键 into id -> answer."""
    out: dict[str, str] = {}
    unit = None
    exam = None
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("### U"):
            unit = line.split()[1]
            exam = None
            continue
        if line.startswith("### 期末 A"):
            unit, exam = None, "A"
            continue
        if line.startswith("### 期末 B"):
            unit, exam = None, "B"
            continue
        if unit:
            # S1-Q01 C　S1-Q02 C
            for m in re.finditer(r"(S\d-Q\d{2}|E-Q\d{2})\s+(.+?)(?=\s{1,}(?:S\d-Q|E-Q)|$)", line):
                qid, ans = m.group(1), m.group(2).strip()
                ans = re.sub(r"\s{2,}", " ", ans).strip("　 ")
                out[f"{unit}-{qid}"] = ans
        if exam:
            for m in re.finditer(rf"({exam}\d{{2}})\s+(.+?)(?=\s+{exam}\d{{2}}|$)", line):
                out[m.group(1)] = m.group(2).strip()
    return out


def parse_essay_bank(text: str) -> dict[str, list[tuple[str, str]]]:
    """unit -> list of (qid, answer) from the long 详解 half (may be old numbering)."""
    bank: dict[str, list[tuple[str, str]]] = {}
    cur = None
    for line in text.splitlines():
        if re.match(r"^## U\d{2}$", line.strip()):
            cur = line.strip().split()[1]
            bank.setdefault(cur, [])
            continue
        if line.strip().startswith("## 期末"):
            cur = line.strip().replace("## ", "")
            bank.setdefault(cur, [])
            continue
        m = re.match(r"\*\*(S\d-Q\d{2}|E-Q\d{2}|[AB]\d{2})\*\*\s*(.+)", line.strip())
        if m and cur:
            bank[cur].append((m.group(1), m.group(2).strip()))
    return bank


def parse_questions(md: str, default_section: str | None = None) -> list[dict]:
    pat = re.compile(
        r"\*\*((?:U\d{2}-(?:S\d|E)-Q\d{2})|(?:[AB]\d{2}))"
        r"\s*\[([易中难])\]【([选填问])】\*\*\s*"
        r"(.*?)(?=\n\*\*(?:U\d{2}-|[AB]\d{2}\s)|\n## |\Z)",
        re.S,
    )
    qs = []
    for m in pat.finditer(md):
        qid, d, k, body = m.group(1), m.group(2), m.group(3), m.group(4).strip()
        lines = [ln.rstrip() for ln in body.splitlines()]
        opts, stem_lines = [], []
        for ln in lines:
            raw = ln.strip().replace(" ", " ")
            if re.match(r"^[A-D][\.、．]\s*", raw):
                parts = re.split(r"(?=\b[A-D]\.\s)", raw)
                for p in parts:
                    p = p.strip()
                    if re.match(r"^[A-D][\.、．]", p):
                        opts.append(re.sub(r"^([A-D])[、．]", r"\1.", p))
            else:
                if raw:
                    stem_lines.append(raw)
        stem = " ".join(stem_lines) if stem_lines else body.split("\n")[0]
        # if options were on same line as stem
        if not opts:
            inline = re.findall(r"([A-D]\.\s*[^A-D]+?)(?=\s*[A-D]\.|$)", stem + " ")
            if len(inline) >= 2:
                opts = [x.strip() for x in inline]
                stem = re.split(r"\sA\.\s", stem, maxsplit=1)[0].strip()
        sec = default_section or "all"
        if "-S" in qid:
            sec = "practice-" + qid.split("-")[1].lower().replace("s", "")
            # U01-S1 -> practice-1
            sm = re.search(r"-S(\d)-", qid)
            if sm:
                sec = f"practice-{sm.group(1)}"
        elif "-E-" in qid:
            sec = "unit-test"
        qs.append({
            "id": qid,
            "section": sec,
            "number": qid.split("-")[-1] if "-" in qid else qid,
            "difficulty": DIFF[d],
            "type": KIND[k],
            "stem": stem,
            "options": opts or None,
            "answer": "",
            "explanation": "",
        })
    return qs


def parse_content(md: str) -> tuple[str, str, list[dict]]:
    title = "单元"
    m = re.search(r"^#\s+(.+)$", md, re.M)
    if m:
        title = m.group(1).strip()
    # cut at first 练习
    cut = re.search(r"\n### 练习", md)
    head = md[: cut.start()] if cut else md
    parts = re.split(r"\n##\s+", head)
    intro = parts[0]
    intro = re.sub(r"^#.*\n+", "", intro).strip()
    sections = []
    for i, block in enumerate(parts[1:], 1):
        lines = block.strip().splitlines()
        if not lines:
            continue
        h = lines[0].strip()
        # "2.1 画面：..."
        num = ""
        title_s = h
        mm = re.match(r"([\d.]+)\s+(.*)", h)
        if mm:
            num, title_s = mm.group(1), mm.group(2)
        else:
            num = str(i)
        sections.append({
            "id": f"section-{num.replace('.', '-')}",
            "number": num,
            "title": title_s,
            "content": "\n".join(lines[1:]).strip(),
        })
    return title, intro, sections


def attach_answers(qs: list[dict], obj: dict[str, str], essays: dict[str, list[tuple[str, str]]], unit: str | None):
    for q in qs:
        ov = OVERRIDE.get(q["id"])
        if ov:
            q["answer"], q["explanation"] = ov[0], ov[1]
            continue
        # objective key
        key = q["id"]
        if key in obj:
            q["answer"] = obj[key]
            q["explanation"] = "见教材配套答案详解 · 客观题键。"
            continue
        # U01-S1-Q05 style in obj as U01-S1-Q05 already
        # Do not match 详解 old numbering by id. Fuzzy-match Chinese chunks in the stem.
        bank_key = unit or ""
        cand = essays.get(bank_key, [])
        chunks = re.findall(r"[\u4e00-\u9fff]{2,}", q["stem"])
        best, score = None, 0
        for _i, ans in cand:
            sc = sum(1 for c in chunks if c in ans)
            if sc > score:
                best, score = ans, sc
        if best and score >= 2:
            q["answer"] = best
            q["explanation"] = "口径来自教材配套答案详解（按题意匹配）。"
        else:
            q["answer"] = "对照本节教材正文作答。标准数字只认 evidence/。"
            q["explanation"] = ""


def page_html(data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(data.get("title") or "学习")}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
  <link rel="stylesheet" href="style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <div class="app">
    <aside class="sidebar" id="sidebar"></aside>
    <main class="main" id="main"></main>
  </div>
  <div class="help" id="help" onclick="if(event.target===this)this.classList.remove('show')">
    <div class="help-box">
      <h3>快捷键</h3>
      <p><kbd>Tab</kbd> 教材 / 练习</p>
      <p><kbd>1</kbd>–<kbd>4</kbd> 切换练习小节（单元页）</p>
      <p><kbd>0</kbd>–<kbd>3</kbd> 期末卷按题型筛</p>
      <p><kbd>J</kbd>/<kbd>K</kbd> 或方向键 上下题</p>
      <p><kbd>Space</kbd> 显示/收起答案</p>
      <p><kbd>M</kbd> 标记掌握（存在本机 localStorage）</p>
      <p><kbd>A</kbd> 全开/全收　<kbd>H</kbd> 只看未掌握　<kbd>R</kbd> 重置</p>
      <p><kbd>?</kbd> 本帮助　<kbd>Esc</kbd> 关闭</p>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script>window.PAGE_DATA = {payload};</script>
  <script src="player.js"></script>
</body>
</html>
"""


def main() -> None:
    ans_md = (ROOT / "教材配套答案详解.md").read_text(encoding="utf-8")
    # split obj key vs rest
    obj_part = ans_md
    if "## U01" in ans_md:
        # first U01 after 客观题键
        idx = ans_md.find("\n## U01\n")
        if idx > 0:
            obj_part = ans_md[:idx]
            rest = ans_md[idx:]
        else:
            rest = ans_md
    else:
        rest = ans_md
    obj = parse_obj_key(obj_part)
    essays = parse_essay_bank(rest)

    index_cards = []

    for uid, fname, short in UNITS:
        md = (ROOT / fname).read_text(encoding="utf-8")
        title, intro, sections = parse_content(md)
        intro = intro.replace("](figures/", "](../figures/")
        for s in sections:
            s["content"] = s["content"].replace("](figures/", "](../figures/")
        qs = parse_questions(md)
        attach_answers(qs, obj, essays, uid)
        # section list for sidebar
        sec_ids = []
        for q in qs:
            if q["section"] not in [s["id"] for s in sec_ids]:
                label = {"unit-test": "单元卷"}.get(q["section"], q["section"].replace("practice-", "练习 "))
                if q["section"].startswith("practice-"):
                    label = "练习 " + q["section"].split("-")[1]
                sec_ids.append({"id": q["section"], "title": label})
        data = {
            "id": uid.lower(),
            "kind": "unit",
            "title": title,
            "subtitle": short + " · 本地学习",
            "intro": intro,
            "contentSections": sections,
            "sections": sec_ids,
            "questions": qs,
        }
        out = WEB / f"{uid.lower()}.html"
        out.write_text(page_html(data), encoding="utf-8")
        n_ok = sum(1 for q in qs if q["answer"] and not q["answer"].startswith("对照教材"))
        print(f"{uid}: {len(qs)} questions, {n_ok} answered, -> {out.name}")
        index_cards.append((uid.lower() + ".html", title, f"{len(qs)} 题 · 教材+练习"))

    for exam_id, fname, title in [
        ("final-a", "期末A.md", "期末综合检测 A 卷"),
        ("final-b", "期末B.md", "期末综合检测 B 卷"),
    ]:
        md = (ROOT / fname).read_text(encoding="utf-8")
        qs = parse_questions(md, default_section="all")
        bank_name = "期末 A" if "A" in fname else "期末 B"
        attach_answers(qs, obj, essays, bank_name)
        info = ""
        m = re.search(r"闭卷[^\n]+", md)
        if m:
            info = m.group(0)
        data = {
            "id": exam_id,
            "kind": "exam",
            "title": title,
            "subtitle": "40 题 · 2:2:6",
            "info": info,
            "questions": qs,
        }
        out = WEB / f"{exam_id}.html"
        out.write_text(page_html(data), encoding="utf-8")
        n_ok = sum(1 for q in qs if q["answer"] and not q["answer"].startswith("对照教材"))
        print(f"{exam_id}: {len(qs)} questions, {n_ok} answered")
        index_cards.append((exam_id + ".html", title, f"{len(qs)} 题 · 只练习"))

    cards = "\n".join(
        f'<a class="hub-card" href="{href}"><h3>{escape(title)}</h3><p>{escape(desc)}</p></a>'
        for href, title, desc in index_cards
    )
    (WEB / "index.html").write_text(
        f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>气动代理筛选 · 本地学习站</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="main" style="max-width:980px">
    <h1 style="margin:0 0 8px">气动代理筛选 · 本地学习站</h1>
    <p style="color:var(--color-text-muted);margin:0 0 24px">
      对着教材正文做题。空格看答案。答案已按 <code>evidence/</code> 与《教材配套答案详解》对齐。
      双击本页即可；公式需联网加载 KaTeX。掌握进度存在浏览器本地。
    </p>
    <div class="hub-grid">{cards}</div>
    <p style="margin-top:28px;font-size:13px;color:var(--color-text-faint)">
      数字口径：R² 0.9844 / 0.9561 / 0.9827 · η_max 0.9173 · ṁ_max 21.74 @ η≈0.873 · 覆盖率 89/65/88 · relrms −3.39 未收敛
    </p>
  </main>
</body>
</html>
""",
        encoding="utf-8",
    )
    print("index.html written")


if __name__ == "__main__":
    main()
