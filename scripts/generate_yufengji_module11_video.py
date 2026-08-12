import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont

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
FPS = 12

BG_COLOR = (11, 14, 13)
PANEL_COLOR = (21, 26, 24)
BORDER_COLOR = (45, 117, 105)
TEXT_MAIN = (230, 235, 225)
TEXT_MUTED = (143, 157, 147)
ACCENT_GOLD = (231, 200, 91)
ACCENT_TEAL = (181, 222, 208)
ACCENT_RED = (249, 115, 22)
ACCENT_BLUE = (56, 189, 248)

SCENES = [
    {
        "id": 1,
        "title": "01 / 矛盾引入：工作温度远超材料极限",
        "duration": 12,
        "subtitle": "欢迎来到《御风记》第十一讲！今天我们探索发动机里最难造的零件——涡轮叶片。"
    },
    {
        "id": 2,
        "title": "02 / 物理悬念：在 500℃ 烤箱里保持冰淇淋不化",
        "duration": 14,
        "subtitle": "燃气温度高达 2000K (1727℃)，而合金在 1150℃ 开始软化，叶片如何在烈焰中生存？"
    },
    {
        "id": 3,
        "title": "03 / 救命绝技一：像钻石一样——单晶高温合金",
        "duration": 16,
        "subtitle": "第一招：消灭所有晶界！采用螺旋选晶法铸造单晶叶片，整片叶片如同一颗完整的钻石。"
    },
    {
        "id": 4,
        "title": "04 / 救命绝技二：穿上陶瓷宇航服——热障涂层 (TBC)",
        "duration": 16,
        "subtitle": "第二招：热障涂层！在金属表面喷涂微米级陶瓷涂层，极低导热率瞬间阻隔两百多度高温。"
    },
    {
        "id": 5,
        "title": "05 / 救命绝技三：会呼吸的叶片——内部蛇形流道与气膜冷却",
        "duration": 18,
        "subtitle": "第三招：气膜冷却！冷气穿过内部蛇形通道，从数千微孔喷出，在表面织就低温保护毯。"
    },
    {
        "id": 6,
        "title": "06 / 结语与青年使命：一代材料，一代航发",
        "duration": 12,
        "subtitle": "一代材料，一代航发。小小的涡轮叶片凝聚人类工程极限，两机重器属于我们的时代刚刚开始！"
    }
]

def draw_header(draw, scene_title):
    draw.rectangle([(0, 0), (WIDTH, 60)], fill=PANEL_COLOR)
    draw.line([(0, 60), (WIDTH, 60)], fill=(45, 117, 105), width=2)
    draw.line([(0, 0), (WIDTH, 3)], fill=ACCENT_GOLD, width=3)
    
    draw.text((30, 18), "御风记 14 讲 · 航发科普", fill=ACCENT_GOLD, font=get_font(16))
    draw.text((220, 18), "|", fill=(80, 90, 85), font=get_font(16))
    draw.text((240, 18), scene_title, fill=TEXT_MAIN, font=get_font(18))
    draw.text((WIDTH - 260, 20), "西安交通大学能动强基 2501 班", fill=TEXT_MUTED, font=get_font(14))

def draw_footer(draw, subtitle_text):
    draw.rectangle([(0, HEIGHT - 75), (WIDTH, HEIGHT)], fill=(15, 18, 17))
    draw.line([(0, HEIGHT - 75), (WIDTH, HEIGHT - 75)], fill=(45, 117, 105), width=1)
    
    font_sub = get_font(18)
    bbox = draw.textbbox((0, 0), subtitle_text, font=font_sub)
    w = bbox[2] - bbox[0]
    draw.text(((WIDTH - w) // 2, HEIGHT - 50), subtitle_text, fill=ACCENT_TEAL, font=font_sub)

def render_scene_1(frame_idx, total_frames):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_header(draw, "01 / 矛盾引入：工作温度远超材料极限")
    
    draw.rectangle([(60, 90), (WIDTH - 60, HEIGHT - 100)], fill=PANEL_COLOR, outline=(45, 117, 105), width=1)
    draw.text((90, 110), "温度的世界：从生活常识到航空发动机核心", fill=ACCENT_GOLD, font=get_font(24))
    
    items = [
        ("开水沸腾 (Water Boiling)", "373 K (100 ℃)", "日常烹饪沸点", ACCENT_BLUE, 0.15),
        ("铝合金熔点 (Aluminum Melt)", "933 K (660 ℃)", "普通飞机机身蒙皮软化", (150, 190, 210), 0.35),
        ("镍基合金极限 (Superalloy Limit)", "1423 K (1150 ℃)", "叶片金属开始软化失去强度", ACCENT_GOLD, 0.55),
        ("普通钢铁熔点 (Steel Melt)", "1800 K (1538 ℃)", "普通钢铁全部化为钢水", (240, 150, 80), 0.75),
        ("涡轮前燃气温度 (Turbine Inlet Temp)", "2000 K (1727 ℃)", "顶级航空发动机实际燃烧室出口燃气", ACCENT_RED, 0.95),
    ]
    
    progress = min(1.0, frame_idx / (FPS * 2))
    for i, (name, temp_str, desc, col, bar_len) in enumerate(items):
        y = 160 + i * 75
        draw.rectangle([(90, y), (WIDTH - 90, y + 60)], fill=(15, 20, 18), outline=(35, 45, 40), width=1)
        draw.text((110, y + 10), name, fill=TEXT_MAIN, font=get_font(18))
        draw.text((110, y + 34), desc, fill=TEXT_MUTED, font=get_font(13))
        draw.text((560, y + 18), temp_str, fill=col, font=get_font(20))
        
        bar_w = int((WIDTH - 850) * bar_len * min(1.0, progress * (i + 1) / 2))
        draw.rectangle([(800, y + 20), (800 + bar_w, y + 40)], fill=col)
        draw.rectangle([(800, y + 20), (WIDTH - 120, y + 40)], outline=(50, 60, 55), width=1)
        
    draw_footer(draw, "涡轮前燃气温度高达 2000K (1727℃)，而最先进的镍基合金在 1150℃ 就会丧失强度！")
    return img

def render_scene_2(frame_idx, total_frames):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_header(draw, "02 / 物理悬念：在 500℃ 烤箱里保持冰淇淋不化")
    
    draw.rectangle([(60, 90), (620, HEIGHT - 100)], fill=PANEL_COLOR, outline=(45, 117, 105), width=1)
    draw.text((90, 115), "[形象比喻] 冰淇淋在烤箱中保持不化", fill=ACCENT_RED, font=get_font(22))
    draw.text((90, 160), "• 超温环境：外界燃气 1700℃，材料软化点 1150℃", fill=TEXT_MAIN, font=get_font(16))
    draw.text((90, 200), "• 致命温差：温差高达 500℃ 以上！", fill=ACCENT_GOLD, font=get_font(16))
    draw.text((90, 240), "• 形象对比：就像把一支冰淇淋放进 500℃ 烤箱，", fill=TEXT_MUTED, font=get_font(16))
    draw.text((110, 275), "要求它不仅绝对不能融化，还要保持极高刚度！", fill=TEXT_MAIN, font=get_font(16))
    
    center_x, center_y = 340, 440
    angle = frame_idx * 0.3
    for k in range(8):
        blade_ang = angle + k * (2 * math.pi / 8)
        bx = center_x + math.cos(blade_ang) * 75
        by = center_y + math.sin(blade_ang) * 75
        draw.line([(center_x, center_y), (bx, by)], fill=ACCENT_TEAL, width=5)
    draw.ellipse([(center_x - 18, center_y - 18), (center_x + 18, center_y + 18)], fill=ACCENT_GOLD)
    
    draw.rectangle([(650, 90), (WIDTH - 60, HEIGHT - 100)], fill=PANEL_COLOR, outline=(45, 117, 105), width=1)
    draw.text((680, 115), "[极端载荷] 每片叶片拉挂大货车", fill=ACCENT_GOLD, font=get_font(22))
    
    stats = [
        ("15,000 RPM", "转子超高速旋转", "叶尖线速度超越音速"),
        ("20~30 吨", "单个叶片离心拉力", "相当于每片叶片挂一辆重型卡车"),
        ("100+ 大气压", "燃烧室高温高压冲击", "狂暴气流持续冲刷冲蚀"),
    ]
    for j, (num, label, desc) in enumerate(stats):
        yy = 160 + j * 120
        draw.rectangle([(680, yy), (WIDTH - 90, yy + 100)], fill=(15, 20, 18), outline=(35, 45, 40), width=1)
        draw.text((700, yy + 10), num, fill=ACCENT_GOLD, font=get_font(28))
        draw.text((700, yy + 48), label, fill=TEXT_MAIN, font=get_font(16))
        draw.text((700, yy + 72), desc, fill=TEXT_MUTED, font=get_font(13))
        
    draw_footer(draw, "既要在超越熔点 500 度的烈焰中生存，又要承受几十吨的离心拉力——这就是涡轮叶片的挑战！")
    return img

def render_scene_3(frame_idx, total_frames):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_header(draw, "03 / 救命绝技一：像钻石一样——单晶高温合金")
    
    draw.rectangle([(60, 90), (620, HEIGHT - 100)], fill=PANEL_COLOR, outline=(200, 80, 60), width=2)
    draw.text((90, 115), "[传统工艺] 普通多晶金属 (Polycrystal)", fill=ACCENT_RED, font=get_font(22))
    draw.text((90, 150), "由无数小晶粒拼接而成，存在大量【晶界】弱点", fill=TEXT_MUTED, font=get_font(15))
    
    box_l, box_t, box_r, box_b = 110, 190, 570, 480
    draw.rectangle([(box_l, box_t), (box_r, box_b)], fill=(20, 15, 15), outline=(60, 30, 30))
    grains = [
        [(160, 190), (240, 330), (190, 480)],
        [(310, 190), (280, 350), (360, 480)],
        [(450, 190), (410, 300), (490, 480)],
        [(110, 330), (240, 330), (410, 300), (570, 320)],
    ]
    for g in grains:
        draw.line(g, fill=(180, 70, 60), width=3)
        
    crack_prog = min(1.0, (frame_idx % (FPS * 2)) / (FPS * 2))
    crack_x = int(240 + crack_prog * 100)
    crack_y = int(330 + crack_prog * 80)
    draw.line([(240, 330), (crack_x, crack_y)], fill=(255, 230, 80), width=4)
    draw.text((250, 380), "[警示] 沿晶界滑移断裂！", fill=ACCENT_RED, font=get_font(16))
    
    draw.rectangle([(650, 90), (WIDTH - 60, HEIGHT - 100)], fill=PANEL_COLOR, outline=(45, 117, 105), width=2)
    draw.text((680, 115), "[核心突破] 单晶高温合金 (Single Crystal)", fill=ACCENT_TEAL, font=get_font(22))
    draw.text((680, 150), "整片叶片无缝生长为单一晶体，【零晶界】", fill=TEXT_MUTED, font=get_font(15))
    
    r_box_l, r_box_t, r_box_r, r_box_b = 700, 190, 1160, 480
    draw.rectangle([(r_box_l, r_box_t), (r_box_r, r_box_b)], fill=(12, 22, 20), outline=(30, 80, 70))
    for gx in range(r_box_l + 25, r_box_r, 32):
        for gy in range(r_box_t + 25, r_box_b, 32):
            draw.ellipse([(gx - 3, gy - 3), (gx + 3, gy + 3)], fill=ACCENT_TEAL)
            draw.line([(gx, gy), (gx + 32, gy)], fill=(45, 117, 105), width=1)
            draw.line([(gx, gy), (gx, gy + 32)], fill=(45, 117, 105), width=1)
    draw.text((790, 380), "[优势] 结构致密 · 像天然钻石般坚不可摧", fill=ACCENT_TEAL, font=get_font(16))
    
    draw.text((90, 520), "制造工艺：螺旋选晶法 (Spiral Selector) 阻挡杂晶，只保留一颗晶粒向上生长为整片叶片！", fill=ACCENT_GOLD, font=get_font(16))
    draw_footer(draw, "第一招：消灭金属的晶界！单晶铸造让整片叶片像一颗钻石般浑然一体，消除高温蠕变弱点。")
    return img

def render_scene_4(frame_idx, total_frames):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_header(draw, "04 / 救命绝技二：穿上陶瓷宇航服——热障涂层 (TBC)")
    
    draw.rectangle([(60, 90), (720, HEIGHT - 100)], fill=PANEL_COLOR, outline=(45, 117, 105), width=1)
    draw.text((90, 115), "[微观截面] 热障涂层微观截面与温度梯度降", fill=ACCENT_GOLD, font=get_font(22))
    
    draw.rectangle([(90, 160), (680, 230)], fill=(180, 50, 30), outline=(220, 80, 40))
    draw.text((110, 185), "超高温主流燃气 (Hot Gas Flow) : 1700 ℃", fill=(255, 240, 220), font=get_font(18))
    
    draw.rectangle([(90, 230), (680, 320)], fill=(220, 190, 120), outline=(240, 220, 160))
    draw.text((110, 255), "陶瓷表层 (YSZ 钇稳定氧化锆，0.25mm)", fill=(30, 25, 15), font=get_font(18))
    draw.text((110, 285), "导热系数极低 (k < 1.5 W/m·K) 剧烈温降 ΔT = -170 ℃", fill=(80, 60, 20), font=get_font(14))
    
    draw.rectangle([(90, 320), (680, 390)], fill=(100, 130, 120), outline=(130, 160, 150))
    draw.text((110, 345), "金属粘结层 (MCrAlY Bond Coat) : 缓解热应力膨胀", fill=TEXT_MAIN, font=get_font(18))
    
    draw.rectangle([(90, 390), (680, 490)], fill=(40, 55, 50), outline=(60, 85, 75))
    draw.text((110, 420), "镍基单晶基体金属 (Superalloy Substrate)", fill=ACCENT_TEAL, font=get_font(18))
    draw.text((110, 450), "金属表面实际温度降至: 980 ℃ (安全受力区间)", fill=ACCENT_GOLD, font=get_font(18))
    
    draw.rectangle([(750, 90), (WIDTH - 60, HEIGHT - 100)], fill=PANEL_COLOR, outline=(45, 117, 105), width=1)
    draw.text((780, 115), "[技术特性] 航发宇航服的三大核心特性", fill=ACCENT_TEAL, font=get_font(22))
    
    props = [
        ("1. 极低导热率", "微观柱状晶或多孔结构，锁住热量"),
        ("2. 耐千度高温", "氧化锆陶瓷熔点高达 2700℃，不惧火焰"),
        ("3. 纳米级结合", "等离子喷涂或电子束物理气相沉积 (EB-PVD)"),
    ]
    for k, (t, d) in enumerate(props):
        draw.text((780, 180 + k * 95), t, fill=ACCENT_GOLD, font=get_font(18))
        draw.text((780, 215 + k * 95), d, fill=TEXT_MUTED, font=get_font(14))
        
    draw_footer(draw, "第二招：给叶片穿上陶瓷宇航服！仅 0.25 毫米的纳米涂层，就能阻隔近 200 度的致命高温。")
    return img

def render_scene_5(frame_idx, total_frames):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_header(draw, "05 / 救命绝技三：会呼吸的叶片——内部蛇形流道与气膜冷却")
    
    draw.rectangle([(60, 90), (720, HEIGHT - 100)], fill=PANEL_COLOR, outline=(45, 117, 105), width=1)
    draw.text((90, 115), "[结构剖析] 内部蛇形多回程通道与外部气膜孔", fill=ACCENT_BLUE, font=get_font(22))
    
    bx, by = 130, 200
    draw.rectangle([(bx, by), (bx + 520, by + 240)], fill=(20, 28, 25), outline=(45, 117, 105), width=2)
    
    ch_h = 50
    draw.rectangle([(bx + 30, by + 30), (bx + 490, by + 30 + ch_h)], fill=(30, 70, 90), outline=ACCENT_BLUE)
    draw.text((bx + 60, by + 45), "压气机引出二次冷气 (600℃)", fill=ACCENT_TEAL, font=get_font(18))
    
    anim_offset = (frame_idx * 4) % 30
    for hx in range(bx + 70, bx + 460, 50):
        draw.ellipse([(hx - 4, by + 26), (hx + 4, by + 34)], fill=ACCENT_GOLD)
        for ay in range(by - 20, by + 20, 15):
            draw.line([(hx, ay + anim_offset), (hx + 10, ay + anim_offset - 10)], fill=ACCENT_BLUE, width=2)
            
    draw.line([(bx, by - 8), (bx + 520, by - 8)], fill=ACCENT_BLUE, width=6)
    draw.text((bx + 120, by - 32), "[保护层] 流动气膜保护毯 (Film Blanket)", fill=ACCENT_BLUE, font=get_font(18))
    draw.text((90, 480), "三步协同：内部强迫对流换热 + 冲击冷却 + 外部气膜覆盖隔绝！", fill=ACCENT_GOLD, font=get_font(16))
    
    draw.rectangle([(750, 90), (WIDTH - 60, HEIGHT - 100)], fill=PANEL_COLOR, outline=(45, 117, 105), width=1)
    draw.text((780, 115), "[物理机制] 空气也能成为隔热盾牌", fill=ACCENT_GOLD, font=get_font(22))
    
    steps = [
        ("1. 引出冷气", "从高压压气机引出 ~600℃ 相对低温空气"),
        ("2. 内部蛇形换热", "带肋蛇形通道将叶片内部热量迅速带走"),
        ("3. 激光打微孔", "叶片表面激光加工数千个倾斜微小孔洞"),
        ("4. 贴体气膜覆盖", "冷气喷出紧贴叶片外壁，燃气无法直接接触金属"),
    ]
    for m, (t, d) in enumerate(steps):
        draw.text((780, 175 + m * 75), t, fill=ACCENT_TEAL, font=get_font(18))
        draw.text((780, 205 + m * 75), d, fill=TEXT_MUTED, font=get_font(14))
        
    draw_footer(draw, "第三招：会呼吸的气膜冷却！数千个激光微孔喷出冷气，在叶片表面织就一层隔绝烈火的保护毯。")
    return img

def render_scene_6(frame_idx, total_frames):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_header(draw, "06 / 结语与航发青年担当：一代材料，一代航发")
    
    draw.rectangle([(120, 100), (WIDTH - 120, HEIGHT - 100)], fill=PANEL_COLOR, outline=ACCENT_GOLD, width=2)
    draw.text((WIDTH // 2 - 200, 140), "一代材料，一代航空发动机", fill=ACCENT_GOLD, font=get_font(28))
    draw.text((WIDTH // 2 - 160, 190), "工业皇冠上的明珠 · 终极工程之美", fill=ACCENT_TEAL, font=get_font(18))
    
    summaries = [
        ("1. 单晶合金", "消灭晶界，获得极强的高温抗蠕变与抗疲劳寿命"),
        ("2. 热障涂层", "0.25 毫米纳米陶瓷，强力阻隔 150~200℃ 致命温差"),
        ("3. 气膜冷却", "精巧内部蛇形流道与万千微孔，用空气织造贴体隔热盾牌"),
        ("4. 青年担当", "西交大能动强基 · 掌握 AI 代理与 CFD 优化，投身两机战略报国"),
    ]
    for idx, (t, d) in enumerate(summaries):
        yy = 250 + idx * 55
        draw.text((180, yy), t, fill=ACCENT_GOLD, font=get_font(18))
        draw.text((320, yy), d, fill=TEXT_MAIN, font=get_font(18))
        
    draw.line([(180, 480), (WIDTH - 180, 480)], fill=(45, 117, 105), width=1)
    draw.text((WIDTH // 2 - 190, 505), "周至县九峰初中科普课件 · 孙承泽制作", fill=TEXT_MUTED, font=get_font(18))
    
    draw_footer(draw, "航空发动机是工业皇冠上的明珠，涡轮叶片是明珠之巅。御风前行，属于我们的时代刚刚开始！")
    return img

def render_frame(scene_num, f_idx, tot_f):
    if scene_num == 1:
        return render_scene_1(f_idx, tot_f)
    elif scene_num == 2:
        return render_scene_2(f_idx, tot_f)
    elif scene_num == 3:
        return render_scene_3(f_idx, tot_f)
    elif scene_num == 4:
        return render_scene_4(f_idx, tot_f)
    elif scene_num == 5:
        return render_scene_5(f_idx, tot_f)
    else:
        return render_scene_6(f_idx, tot_f)

output_video = "videos/御风记_第11讲_温度与材料极限_为什么航发这么难造.mp4"
total_sec = sum(s["duration"] for s in SCENES)

ffmpeg_cmd = [
    os.path.expanduser("~/.local/bin/ffmpeg"),
    "-y",
    "-f", "rawvideo",
    "-vcodec", "rawvideo",
    "-s", f"{WIDTH}x{HEIGHT}",
    "-pix_fmt", "rgb24",
    "-r", str(FPS),
    "-i", "-",
    "-f", "lavfi",
    "-i", f"sine=frequency=432:sample_rate=44100:duration={total_sec}",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "ultrafast",
    "-crf", "22",
    "-c:a", "aac",
    "-b:a", "128k",
    "-shortest",
    output_video
]

print(f"Starting rendering {total_sec}s video at {FPS} FPS ({total_sec*FPS} frames)...")
proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

for s_idx, s in enumerate(SCENES, 1):
    dur = s["duration"]
    n_frames = dur * FPS
    print(f"Rendering Scene {s_idx}/6 ({dur}s)...")
    for f in range(n_frames):
        img = render_frame(s_idx, f, n_frames)
        proc.stdin.write(img.tobytes())

proc.stdin.close()
proc.wait()

print(f"SUCCESS: Video rendered to {output_video}")
print(f"File size: {os.path.getsize(output_video) / 1024 / 1024:.2f} MB")
