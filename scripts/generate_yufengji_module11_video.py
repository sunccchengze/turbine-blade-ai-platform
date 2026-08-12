import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

os.makedirs("videos", exist_ok=True)
os.makedirs("assets/fonts", exist_ok=True)

FONT_PATH = "assets/fonts/NotoSansSC-Bold.ttf"
if not os.path.exists(FONT_PATH):
    FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def get_font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except Exception:
        return ImageFont.load_default()

WIDTH = 1280
HEIGHT = 720
FPS = 15

# Color Palette (Morandi & Industrial Titanium)
BG_COLOR = (11, 14, 13)       # #0b0e0d
PANEL_COLOR = (18, 24, 22, 235)
BORDER_COLOR = (45, 117, 105, 180)
TEXT_MAIN = (240, 245, 235)
TEXT_MUTED = (160, 175, 165)
ACCENT_GOLD = (231, 200, 91)
ACCENT_TEAL = (181, 222, 208)
ACCENT_RED = (249, 115, 22)
ACCENT_BLUE = (56, 189, 248)

SCENES = [
    {
        "id": 1,
        "title": "01 / 矛盾引入：工作温度远超材料极限",
        "sub": "航空发动机涡轮叶片面临的极端地狱考验",
        "image": "assets/video_art/scene1_turbine_intro.jpg",
        "audio": "audio/scene1.mp3",
        "duration": 12.5,
        "subtitle": "欢迎来到《御风记》第十一讲！我们要探索发动机里最难造的核心零件——涡轮叶片。它承受着整台发动机里最极端的考验。"
    },
    {
        "id": 2,
        "title": "02 / 物理悬念：在 500℃ 烤箱里保持冰淇淋不化",
        "sub": "燃气温度 2000K (1727℃) vs 镍基合金软化点 1150℃",
        "image": "assets/video_art/scene2_thermal_inferno.jpg",
        "audio": "audio/scene2.mp3",
        "duration": 18.5,
        "subtitle": "燃气温度高达两千开尔文，也就是一千七百多摄氏度！而最先进的镍基合金在 1150℃ 就开始软化。这就像把冰淇淋放进五百度的烤箱，还要承受上万转的离心拉力！"
    },
    {
        "id": 3,
        "title": "03 / 救命绝技一：像钻石一样——单晶高温合金",
        "sub": "消灭金属晶界弱点 · 彻底根除高温蠕变裂纹",
        "image": "assets/video_art/scene3_single_crystal.jpg",
        "audio": "audio/scene3.mp3",
        "duration": 17.8,
        "subtitle": "第一项救命绝技：消灭晶界！普通金属由许多晶粒拼成，高温下容易从晶界断裂。单晶叶片整片就是一颗完整的晶体，像天然钻石一样浑然一体。"
    },
    {
        "id": 4,
        "title": "04 / 救命绝技二：穿上陶瓷宇航服——热障涂层 (TBC)",
        "sub": "0.25mm 钇稳定氧化锆 (YSZ) · 强阻隔 150~200℃",
        "image": "assets/video_art/scene4_thermal_barrier_coating.jpg",
        "audio": "audio/scene4.mp3",
        "duration": 16.5,
        "subtitle": "第二项绝技：热障涂层！给叶片穿上一层仅有 0.25 毫米的陶瓷宇航服。氧化锆陶瓷导热极慢，瞬间隔绝近两百度的致命温差。"
    },
    {
        "id": 5,
        "title": "05 / 救命绝技三：会呼吸的叶片——内部蛇形流道与气膜冷却",
        "sub": "压气机 600℃ 冷气 · 形成流动气膜保护毯隔绝烈焰",
        "image": "assets/video_art/scene5_film_cooling.jpg",
        "audio": "audio/scene5.mp3",
        "duration": 14.5,
        "subtitle": "第三项绝技：气膜冷却！从压气机引出相对低温的空气，穿过叶片内部蛇形通道，从数千个激光微孔喷出，在表面织就一层流动降温保护毯。"
    },
    {
        "id": 6,
        "title": "06 / 结语与青年使命：一代材料，一代航发",
        "sub": "西交大能动学院 · 燃气轮机与航空发动机两机国家战略",
        "image": "assets/video_art/scene6_aerospace_future.jpg",
        "audio": "audio/scene6.mp3",
        "duration": 15.0,
        "subtitle": "一代材料，一代航发！小小的单晶涡轮叶片凝聚了人类工程材料与热物理的极限之美。两机重器，属于我们的时代刚刚开始！"
    }
]

# Preload background artworks
bg_images = {}
for s in SCENES:
    if os.path.exists(s["image"]):
        base_img = Image.open(s["image"]).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        # Apply cinematic dark grading to artwork
        darkened = Image.new("RGB", (WIDTH, HEIGHT), (10, 14, 12))
        blended = Image.blend(base_img, darkened, 0.45)
        bg_images[s["id"]] = blended
    else:
        bg_images[s["id"]] = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)

def draw_header(draw, scene_title):
    # Frosted glass style header
    draw.rectangle([(0, 0), (WIDTH, 60)], fill=(12, 16, 15, 230))
    draw.line([(0, 60), (WIDTH, 60)], fill=(45, 117, 105, 180), width=2)
    draw.line([(0, 0), (WIDTH, 3)], fill=ACCENT_GOLD, width=3)
    
    draw.text((30, 18), "御风记 14 讲 · 航发科普", fill=ACCENT_GOLD, font=get_font(16))
    draw.text((230, 18), "|", fill=(90, 105, 95), font=get_font(16))
    draw.text((250, 18), scene_title, fill=TEXT_MAIN, font=get_font(18))
    draw.text((WIDTH - 280, 20), "西安交通大学能动强基 2501 班", fill=TEXT_MUTED, font=get_font(14))

def draw_footer(draw, subtitle_text):
    # Professional subtitle box
    draw.rectangle([(0, HEIGHT - 80), (WIDTH, HEIGHT)], fill=(8, 12, 10, 245))
    draw.line([(0, HEIGHT - 80), (WIDTH, HEIGHT - 80)], fill=(45, 117, 105, 150), width=1)
    
    font_sub = get_font(18)
    
    # Text wrapping if too long
    if len(subtitle_text) > 42:
        part1 = subtitle_text[:38]
        part2 = subtitle_text[38:]
        bbox1 = draw.textbbox((0, 0), part1, font=font_sub)
        w1 = bbox1[2] - bbox1[0]
        draw.text(((WIDTH - w1) // 2, HEIGHT - 68), part1, fill=ACCENT_TEAL, font=font_sub)
        bbox2 = draw.textbbox((0, 0), part2, font=font_sub)
        w2 = bbox2[2] - bbox2[0]
        draw.text(((WIDTH - w2) // 2, HEIGHT - 40), part2, fill=ACCENT_TEAL, font=font_sub)
    else:
        bbox = draw.textbbox((0, 0), subtitle_text, font=font_sub)
        w = bbox[2] - bbox[0]
        draw.text(((WIDTH - w) // 2, HEIGHT - 52), subtitle_text, fill=ACCENT_TEAL, font=font_sub)

def render_scene_frame(scene, frame_idx, total_frames):
    img = bg_images[scene["id"]].copy()
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_ov = ImageDraw.Draw(overlay)
    
    # Left Card
    draw_ov.rectangle([(60, 90), (620, HEIGHT - 105)], fill=PANEL_COLOR, outline=BORDER_COLOR, width=1)
    # Right Card
    draw_ov.rectangle([(650, 90), (WIDTH - 60, HEIGHT - 105)], fill=PANEL_COLOR, outline=BORDER_COLOR, width=1)
    
    # Composite overlay
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_header(draw, scene["title"])
    
    sid = scene["id"]
    if sid == 1:
        draw.text((90, 115), "温度天梯：从生活到航发核心", fill=ACCENT_GOLD, font=get_font(22))
        items = [
            ("开水沸腾 (Water Boiling)", "373 K (100 ℃)", "日常烹饪沸点", ACCENT_BLUE, 0.15),
            ("铝合金熔点 (Aluminum Melt)", "933 K (660 ℃)", "机身蒙皮软化", (150, 190, 210), 0.35),
            ("镍基合金极限 (Superalloy Limit)", "1423 K (1150 ℃)", "叶片软化失去强度", ACCENT_GOLD, 0.55),
            ("普通钢铁熔点 (Steel Melt)", "1800 K (1538 ℃)", "全部化为钢水", (240, 150, 80), 0.75),
            ("涡轮前燃气 (Turbine Inlet)", "2000 K (1727 ℃)", "实际燃烧室出口燃气", ACCENT_RED, 0.95),
        ]
        progress = min(1.0, frame_idx / (FPS * 3))
        for i, (name, temp_str, desc, col, bar_len) in enumerate(items):
            y = 160 + i * 78
            draw.rectangle([(85, y), (595, y + 62)], fill=(12, 18, 16), outline=(35, 50, 45), width=1)
            draw.text((100, y + 8), name, fill=TEXT_MAIN, font=get_font(16))
            draw.text((100, y + 34), desc, fill=TEXT_MUTED, font=get_font(13))
            draw.text((360, y + 16), temp_str, fill=col, font=get_font(18))
            
        draw.text((680, 115), "挑战：超温烈焰下的工程奇迹", fill=ACCENT_TEAL, font=get_font(22))
        draw.text((680, 175), "• 燃气温度 2000K 远超金属承受上限！", fill=ACCENT_GOLD, font=get_font(17))
        draw.text((680, 220), "• 温差高达 500℃ 以上，逼近钢铁沸腾前沿", fill=TEXT_MAIN, font=get_font(16))
        draw.text((680, 265), "• 涡轮叶片在极端地狱考验下必须安全服役", fill=TEXT_MUTED, font=get_font(15))
        draw.text((680, 325), "• 工业皇冠之巅：三大绝技实现绝处逢生", fill=ACCENT_TEAL, font=get_font(17))
        
        draw.rectangle([(680, 400), (WIDTH - 90, 560)], fill=(15, 24, 20), outline=BORDER_COLOR)
        draw.text((710, 425), "核心三绝技路线图：", fill=ACCENT_GOLD, font=get_font(18))
        draw.text((710, 465), "1. 单晶高温合金 (消灭晶界弱点)", fill=TEXT_MAIN, font=get_font(16))
        draw.text((710, 498), "2. 热障涂层 TBC (穿上陶瓷宇航服)", fill=TEXT_MAIN, font=get_font(16))
        draw.text((710, 530), "3. 气膜冷却 (会呼吸的气动流道)", fill=TEXT_MAIN, font=get_font(16))

    elif sid == 2:
        draw.text((90, 115), "[形象比喻] 冰淇淋在烤箱中保持不化", fill=ACCENT_RED, font=get_font(22))
        draw.text((90, 170), "• 极端环境：外界燃气 1727℃，材料极限 1150℃", fill=TEXT_MAIN, font=get_font(16))
        draw.text((90, 215), "• 致命温差：温差高达 500℃ 以上！", fill=ACCENT_GOLD, font=get_font(16))
        draw.text((90, 260), "• 形象对比：就像把一支冰淇淋放进 500℃ 烤箱，", fill=TEXT_MUTED, font=get_font(16))
        draw.text((110, 295), "要求它不仅绝对不融化，还要保持硬度！", fill=TEXT_MAIN, font=get_font(16))
        
        # Draw spinning turbine wheel
        cx, cy = 340, 450
        ang = frame_idx * 0.25
        for k in range(8):
            ba = ang + k * (2 * math.pi / 8)
            draw.line([(cx, cy), (cx + math.cos(ba) * 75, cy + math.sin(ba) * 75)], fill=ACCENT_TEAL, width=5)
        draw.ellipse([(cx - 18, cy - 18), (cx + 18, cy + 18)], fill=ACCENT_GOLD)
        draw.text((250, 550), "高速旋转 15,000 RPM", fill=ACCENT_GOLD, font=get_font(16))

        draw.text((680, 115), "[极端载荷] 每片叶片拉挂重型卡车", fill=ACCENT_GOLD, font=get_font(22))
        stats = [
            ("15,000 RPM", "转子超高速旋转", "叶尖线速度超越音速"),
            ("20~30 吨", "单个叶片离心拉力", "相当于每片叶片挂一辆重型大货车"),
            ("100+ 大气压", "燃烧室高温高压冲击", "狂暴气流持续冲刷冲蚀"),
        ]
        for j, (num, label, desc) in enumerate(stats):
            yy = 160 + j * 125
            draw.rectangle([(680, yy), (WIDTH - 90, yy + 105)], fill=(12, 18, 16), outline=(35, 50, 45), width=1)
            draw.text((700, yy + 10), num, fill=ACCENT_GOLD, font=get_font(26))
            draw.text((700, yy + 48), label, fill=TEXT_MAIN, font=get_font(16))
            draw.text((700, yy + 74), desc, fill=TEXT_MUTED, font=get_font(13))

    elif sid == 3:
        draw.text((90, 115), "[传统工艺] 普通多晶金属 (Polycrystal)", fill=ACCENT_RED, font=get_font(22))
        draw.text((90, 155), "由无数小晶粒拼接而成，存在大量【晶界】弱点", fill=TEXT_MUTED, font=get_font(15))
        
        draw.rectangle([(110, 195), (570, 480)], fill=(20, 15, 15), outline=(60, 30, 30))
        grains = [
            [(160, 195), (240, 335), (190, 480)],
            [(310, 195), (280, 355), (360, 480)],
            [(450, 195), (410, 305), (490, 480)],
            [(110, 335), (240, 335), (410, 305), (570, 325)],
        ]
        for g in grains:
            draw.line(g, fill=(180, 70, 60), width=3)
        draw.text((230, 385), "[断裂隐患] 高温下沿晶界断裂！", fill=ACCENT_RED, font=get_font(16))

        draw.text((680, 115), "[核心突破] 单晶高温合金 (Single Crystal)", fill=ACCENT_TEAL, font=get_font(22))
        draw.text((680, 155), "整片叶片无缝生长为单一晶体，【彻底零晶界】", fill=TEXT_MUTED, font=get_font(15))
        
        draw.rectangle([(700, 195), (1160, 480)], fill=(12, 22, 20), outline=(30, 80, 70))
        for gx in range(725, 1140, 32):
            for gy in range(220, 460, 32):
                draw.ellipse([(gx - 3, gy - 3), (gx + 3, gy + 3)], fill=ACCENT_TEAL)
                draw.line([(gx, gy), (gx + 32, gy)], fill=(45, 117, 105), width=1)
                draw.line([(gx, gy), (gx, gy + 32)], fill=(45, 117, 105), width=1)
        draw.text((790, 385), "[结构特性] 像整块天然钻石般坚固", fill=ACCENT_TEAL, font=get_font(16))
        draw.text((90, 525), "螺旋选晶法 (Spiral Selector) 阻挡所有杂晶，只保留单一取向晶粒生长！", fill=ACCENT_GOLD, font=get_font(16))

    elif sid == 4:
        draw.text((90, 115), "[微观截面] 热障涂层微观温度梯度降", fill=ACCENT_GOLD, font=get_font(22))
        draw.rectangle([(90, 160), (590, 230)], fill=(180, 50, 30), outline=(220, 80, 40))
        draw.text((110, 185), "超高温主流燃气 : 1700 ℃", fill=(255, 240, 220), font=get_font(18))
        
        draw.rectangle([(90, 230), (590, 320)], fill=(220, 190, 120), outline=(240, 220, 160))
        draw.text((110, 255), "陶瓷表层 (YSZ 钇稳定氧化锆，仅 0.25mm)", fill=(30, 25, 15), font=get_font(17))
        draw.text((110, 285), "导热系数极低 (k < 1.5) 剧烈温降 ΔT = -170 ℃", fill=(80, 60, 20), font=get_font(14))
        
        draw.rectangle([(90, 320), (590, 390)], fill=(100, 130, 120), outline=(130, 160, 150))
        draw.text((110, 345), "金属粘结层 (MCrAlY) : 缓解热应力膨胀", fill=TEXT_MAIN, font=get_font(17))
        
        draw.rectangle([(90, 390), (590, 490)], fill=(40, 55, 50), outline=(60, 85, 75))
        draw.text((110, 420), "单晶基体金属 : 温度降至 980 ℃", fill=ACCENT_GOLD, font=get_font(18))

        draw.text((680, 115), "[三大特性] 航发陶瓷宇航服", fill=ACCENT_TEAL, font=get_font(22))
        props = [
            ("1. 极低导热率", "微观柱状晶或多孔结构，锁住热量"),
            ("2. 耐千度高温", "氧化锆陶瓷熔点高达 2700℃，不惧火焰"),
            ("3. 纳米级结合", "等离子喷涂或电子束物理气相沉积 (EB-PVD)"),
        ]
        for k, (t, d) in enumerate(props):
            draw.text((680, 180 + k * 95), t, fill=ACCENT_GOLD, font=get_font(18))
            draw.text((680, 215 + k * 95), d, fill=TEXT_MUTED, font=get_font(14))

    elif sid == 5:
        draw.text((90, 115), "[结构剖析] 蛇形流道与气膜微孔", fill=ACCENT_BLUE, font=get_font(22))
        bx, by = 110, 180
        draw.rectangle([(bx, by), (bx + 480, by + 260)], fill=(20, 28, 25), outline=(45, 117, 105), width=2)
        
        draw.rectangle([(bx + 30, by + 30), (bx + 450, by + 90)], fill=(30, 70, 90), outline=ACCENT_BLUE)
        draw.text((bx + 60, by + 50), "压气机引出二次冷气 (600℃)", fill=ACCENT_TEAL, font=get_font(17))
        
        anim_offset = (frame_idx * 4) % 30
        for hx in range(bx + 60, bx + 430, 45):
            draw.ellipse([(hx - 4, by + 26), (hx + 4, by + 34)], fill=ACCENT_GOLD)
            for ay in range(by - 20, by + 20, 15):
                draw.line([(hx, ay + anim_offset), (hx + 10, ay + anim_offset - 10)], fill=ACCENT_BLUE, width=2)
                
        draw.line([(bx, by - 8), (bx + 480, by - 8)], fill=ACCENT_BLUE, width=6)
        draw.text((bx + 100, by - 32), "[流动气膜] 贴体防护隔热层", fill=ACCENT_BLUE, font=get_font(17))
        draw.text((90, 480), "内部强迫对流 + 冲击冷却 + 外部气膜全方位覆盖！", fill=ACCENT_GOLD, font=get_font(16))

        draw.text((680, 115), "[物理机制] 空气也能成为隔热盾牌", fill=ACCENT_GOLD, font=get_font(22))
        steps = [
            ("1. 引出冷气", "从高压压气机引出 ~600℃ 相对低温空气"),
            ("2. 内部蛇形换热", "带肋蛇形通道将叶片内部热量迅速带走"),
            ("3. 激光打微孔", "叶片表面激光加工数千个倾斜微小孔洞"),
            ("4. 贴体气膜覆盖", "冷气喷出紧贴叶片外壁，隔绝高温燃气接触"),
        ]
        for m, (t, d) in enumerate(steps):
            draw.text((680, 175 + m * 75), t, fill=ACCENT_TEAL, font=get_font(18))
            draw.text((680, 205 + m * 75), d, fill=TEXT_MUTED, font=get_font(14))

    else:
        draw.text((WIDTH // 2 - 180, 120), "一代材料，一代航空发动机", fill=ACCENT_GOLD, font=get_font(28))
        draw.text((WIDTH // 2 - 140, 165), "工业皇冠上的明珠 · 终极工程之美", fill=ACCENT_TEAL, font=get_font(18))
        summaries = [
            ("1. 单晶高温合金", "消灭晶界，获得极强的高温抗蠕变与抗疲劳寿命"),
            ("2. 陶瓷热障涂层", "0.25 毫米纳米陶瓷，强力阻隔 150~200℃ 致命温差"),
            ("3. 贴体气膜冷却", "精巧内部蛇形流道与万千微孔，用冷气织造流动防护毯"),
            ("4. 青年报国担当", "西交大能动强基 · 掌握 AI 代理与 CFD 优化，投身两机战略！"),
        ]
        for idx, (t, d) in enumerate(summaries):
            yy = 225 + idx * 60
            draw.text((160, yy), t, fill=ACCENT_GOLD, font=get_font(18))
            draw.text((320, yy), d, fill=TEXT_MAIN, font=get_font(18))
        draw.line([(160, 485), (WIDTH - 160, 485)], fill=(45, 117, 105), width=1)
        draw.text((WIDTH // 2 - 180, 510), "周至县九峰初中科普课件 · 孙承泽制作", fill=TEXT_MUTED, font=get_font(18))
        
    draw_footer(draw, scene["subtitle"])
    return img

print("1. Generating individual scene video clips with real speech audio...")

scene_clips = []
for s_idx, s in enumerate(SCENES, 1):
    clip_path = f"videos/scene_{s_idx}.mp4"
    audio_path = s["audio"]
    dur = s["duration"]
    n_frames = int(dur * FPS)
    
    ffmpeg_cmd = [
        os.path.expanduser("~/.local/bin/ffmpeg"),
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-i", audio_path,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "ultrafast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "128k",
        clip_path
    ]
    
    print(f"Rendering Scene {s_idx}/6 ({dur}s, {n_frames} frames)...")
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    for f in range(n_frames):
        img = render_scene_frame(s, f, n_frames)
        proc.stdin.write(img.tobytes())
    proc.stdin.close()
    proc.wait()
    scene_clips.append(clip_path)
    print(f"  -> Clip {s_idx} saved: {clip_path}")

print("2. Concatenating all 6 scenes into master educational movie...")
concat_list_path = "videos/concat_list.txt"
with open(concat_list_path, "w") as f:
    for c in scene_clips:
        f.write(f"file '{os.path.abspath(c)}'\n")

output_final = "videos/御风记_第11讲_温度与材料极限_为什么航发这么难造.mp4"
concat_cmd = [
    os.path.expanduser("~/.local/bin/ffmpeg"),
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concat_list_path,
    "-c", "copy",
    output_final
]

subprocess.run(concat_cmd, check=True)

print(f"\n🎉 MASTERPIECE COMPLETE: {output_final}")
print(f"File size: {os.path.getsize(output_final) / 1024 / 1024:.2f} MB")
