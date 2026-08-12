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
FPS = 15

# Color Palette (Morandi & Industrial Titanium)
BG_DARK = (11, 14, 13)
PANEL_BG = (16, 22, 20, 240)
CARD_BG = (12, 17, 15)
CARD_BORDER = (45, 117, 105, 160)
CARD_BORDER_SOLID = (45, 117, 105)
CARD_BORDER_GOLD = (231, 200, 91, 180)

TEXT_MAIN = (240, 245, 235)
TEXT_MUTED = (150, 165, 155)
TEXT_FAINT = (100, 115, 105)

ACCENT_GOLD = (231, 200, 91)
ACCENT_TEAL = (181, 222, 208)
ACCENT_RED = (249, 115, 22)
ACCENT_BLUE = (56, 189, 248)

SCENES = [
    {
        "id": 1,
        "title": "01 / 矛盾引入：工作温度远超材料极限",
        "image": "assets/video_art/scene1_turbine_intro.jpg",
        "audio": "audio/scene1.mp3",
        "duration": 12.5,
        "subtitle": "欢迎来到《御风记》第十一讲！我们要探索发动机里最难造的核心零件——涡轮叶片。它承受着整台发动机里最极端的考验。"
    },
    {
        "id": 2,
        "title": "02 / 物理悬念：在 500度 烤箱里保持冰淇淋不化",
        "image": "assets/video_art/scene2_thermal_inferno.jpg",
        "audio": "audio/scene2.mp3",
        "duration": 18.5,
        "subtitle": "燃气温度高达两千开尔文，也就是一千七百多摄氏度！而最先进的镍基合金在 1150度 就开始软化。这就像把冰淇淋放进五百度的烤箱，还要承受上万转的离心拉力！"
    },
    {
        "id": 3,
        "title": "03 / 救命绝技一：像钻石一样——单晶高温合金",
        "image": "assets/video_art/scene3_single_crystal.jpg",
        "audio": "audio/scene3.mp3",
        "duration": 17.8,
        "subtitle": "第一项救命绝技：消灭晶界！普通金属由许多晶粒拼成，高温下容易从晶界断裂。单晶叶片整片就是一颗完整的晶体，像天然钻石一样浑然一体。"
    },
    {
        "id": 4,
        "title": "04 / 救命绝技二：穿上陶瓷宇航服——热障涂层 (TBC)",
        "image": "assets/video_art/scene4_thermal_barrier_coating.jpg",
        "audio": "audio/scene4.mp3",
        "duration": 16.5,
        "subtitle": "第二项绝技：热障涂层！给叶片穿上一层仅有 0.25 毫米的陶瓷宇航服。氧化锆陶瓷导热极慢，瞬间隔绝近两百度的致命温差。"
    },
    {
        "id": 5,
        "title": "05 / 救命绝技三：会呼吸的叶片——内部蛇形流道与气膜冷却",
        "image": "assets/video_art/scene5_film_cooling.jpg",
        "audio": "audio/scene5.mp3",
        "duration": 14.5,
        "subtitle": "第三项绝技：气膜冷却！从压气机引出相对低温的空气，穿过叶片内部蛇形通道，从数千个激光微孔喷出，在表面织就一层流动降温保护毯。"
    },
    {
        "id": 6,
        "title": "06 / 结语与青年使命：一代材料，一代航发",
        "image": "assets/video_art/scene6_aerospace_future.jpg",
        "audio": "audio/scene6.mp3",
        "duration": 15.0,
        "subtitle": "一代材料，一代航发！小小的单晶涡轮叶片凝聚了人类工程材料与热物理的极限之美。两机重器，属于我们的时代刚刚开始！"
    }
]

bg_images = {}
for s in SCENES:
    if os.path.exists(s["image"]):
        base_img = Image.open(s["image"]).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        darkened = Image.new("RGB", (WIDTH, HEIGHT), (10, 14, 12))
        blended = Image.blend(base_img, darkened, 0.48)
        bg_images[s["id"]] = blended
    else:
        bg_images[s["id"]] = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)

def draw_header(draw, scene_id, scene_title):
    draw.rectangle([(0, 0), (WIDTH, 54)], fill=(12, 16, 14, 245))
    draw.line([(0, 54), (WIDTH, 54)], fill=(45, 117, 105, 180), width=1)
    draw.line([(0, 0), (WIDTH, 3)], fill=ACCENT_GOLD, width=3)
    
    draw.text((25, 17), "御风记 14 讲 · 航发科普", fill=ACCENT_GOLD, font=get_font(15))
    draw.text((205, 17), "|", fill=(80, 95, 85), font=get_font(15))
    draw.text((225, 16), scene_title, fill=TEXT_MAIN, font=get_font(17))
    
    dot_start_x = 730
    for dot_i in range(1, 7):
        dx = dot_start_x + (dot_i - 1) * 24
        is_active = (dot_i == scene_id)
        dot_col = ACCENT_GOLD if is_active else (50, 70, 60)
        draw.ellipse([(dx, 22), (dx + 10, 32)], fill=dot_col)
    
    draw.text((WIDTH - 260, 18), "西安交通大学能动强基 2501 班", fill=TEXT_MUTED, font=get_font(13))

def draw_footer(draw, subtitle_text):
    draw.rectangle([(40, HEIGHT - 76), (WIDTH - 40, HEIGHT - 18)], fill=(10, 14, 12, 245), outline=(45, 117, 105, 200), width=1)
    draw.line([(40, HEIGHT - 76), (WIDTH - 40, HEIGHT - 76)], fill=ACCENT_GOLD, width=2)
    
    font_sub = get_font(17)
    if len(subtitle_text) > 42:
        part1 = subtitle_text[:38]
        part2 = subtitle_text[38:]
        bbox1 = draw.textbbox((0, 0), part1, font=font_sub)
        w1 = bbox1[2] - bbox1[0]
        draw.text(((WIDTH - w1) // 2, HEIGHT - 66), part1, fill=ACCENT_TEAL, font=font_sub)
        bbox2 = draw.textbbox((0, 0), part2, font=font_sub)
        w2 = bbox2[2] - bbox2[0]
        draw.text(((WIDTH - w2) // 2, HEIGHT - 42), part2, fill=ACCENT_TEAL, font=font_sub)
    else:
        bbox = draw.textbbox((0, 0), subtitle_text, font=font_sub)
        w = bbox[2] - bbox[0]
        draw.text(((WIDTH - w) // 2, HEIGHT - 54), subtitle_text, fill=ACCENT_TEAL, font=font_sub)

def render_scene_1(frame_idx, total_frames):
    img = bg_images[1].copy()
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(overlay)
    
    d_ov.rectangle([(50, 75), (680, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    d_ov.rectangle([(710, 75), (WIDTH - 50, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 1, "01 / 矛盾引入：工作温度远超材料极限")
    
    draw.rectangle([(80, 95), (280, 125)], fill=(25, 45, 38), outline=CARD_BORDER_SOLID)
    draw.text((95, 100), "TEMPERATURE LADDER", fill=ACCENT_GOLD, font=get_font(13))
    draw.text((80, 135), "温度天梯：从生活到航发核心", fill=TEXT_MAIN, font=get_font(21))
    
    items = [
        ("开水沸腾 (Water Boiling)", "373 K (100 度)", "日常烹饪标准沸点", ACCENT_BLUE, 0.18),
        ("铝合金熔点 (Aluminum Melt)", "933 K (660 度)", "普通飞机机身蒙皮软化", (150, 190, 210), 0.38),
        ("镍基合金极限 (Superalloy)", "1423 K (1150 度)", "叶片开始软化丧失强度", ACCENT_GOLD, 0.58),
        ("钢铁熔点 (Steel Melt)", "1800 K (1538 度)", "普通钢铁全部化为钢水", (240, 150, 80), 0.78),
        ("涡轮前燃气 (Turbine Inlet)", "2000 K (1727 度)", "实际燃烧室出口狂暴燃气", ACCENT_RED, 0.96),
    ]
    
    progress = min(1.0, frame_idx / (FPS * 2.5))
    for i, (name, temp_str, desc, col, bar_len) in enumerate(items):
        y = 175 + i * 80
        draw.rectangle([(75, y), (655, y + 68)], fill=CARD_BG, outline=(35, 55, 45), width=1)
        draw.text((90, y + 10), name, fill=TEXT_MAIN, font=get_font(16))
        draw.text((90, y + 36), desc, fill=TEXT_MUTED, font=get_font(12))
        
        draw.text((370, y + 12), temp_str, fill=col, font=get_font(17))
        bar_w = int(140 * bar_len * min(1.0, progress * (i + 1) / 2))
        draw.rectangle([(510, y + 26), (510 + bar_w, y + 42)], fill=col)
        draw.rectangle([(510, y + 26), (640, y + 42)], outline=(50, 70, 60), width=1)

    # Right content
    draw.rectangle([(740, 95), (960, 125)], fill=(45, 30, 20), outline=(200, 100, 50))
    draw.text((755, 100), "THE CORE CONTRADICTION", fill=ACCENT_RED, font=get_font(13))
    draw.text((740, 135), "地狱考验：超越熔点的生死存亡", fill=ACCENT_GOLD, font=get_font(21))
    
    draw.rectangle([(740, 185), (WIDTH - 80, 260)], fill=(40, 20, 15), outline=ACCENT_RED, width=1)
    draw.text((760, 198), "致命温差: 温差超过 500 度！", fill=ACCENT_RED, font=get_font(20))
    draw.text((760, 230), "燃气温度已超越镍基合金抗拉强度极限！", fill=TEXT_MAIN, font=get_font(14))
    
    draw.text((740, 290), "• 传统常识：金属在接近熔点时会发生塑性蠕变断裂", fill=TEXT_MUTED, font=get_font(15))
    draw.text((740, 330), "• 航发要求：叶片必须在 2000K 烈焰中安全服役数千小时", fill=TEXT_MAIN, font=get_font(15))
    
    draw.rectangle([(740, 385), (WIDTH - 80, 580)], fill=(14, 22, 19), outline=CARD_BORDER_SOLID, width=1)
    draw.text((760, 405), "解密三大救命黑科技 (The 3 Breakthroughs) :", fill=ACCENT_TEAL, font=get_font(16))
    
    techs = [
        ("01 单晶合金", "消灭所有晶界弱点，如钻石般浑然一体"),
        ("02 热障涂层", "0.25mm 纳米陶瓷，瞬间阻隔 200度 剧烈温差"),
        ("03 气膜冷却", "从内部蛇形通道到微孔，用冷气织造保护毯"),
    ]
    for k, (t1, t2) in enumerate(techs):
        draw.text((760, 445 + k * 42), t1, fill=ACCENT_GOLD, font=get_font(15))
        draw.text((875, 445 + k * 42), t2, fill=TEXT_MUTED, font=get_font(14))
        
    draw_footer(draw, SCENES[0]["subtitle"])
    return img

def render_scene_2(frame_idx, total_frames):
    img = bg_images[2].copy()
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(overlay)
    
    d_ov.rectangle([(50, 75), (630, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    d_ov.rectangle([(660, 75), (WIDTH - 50, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 2, "02 / 物理悬念：在 500度 烤箱里保持冰淇淋不化")
    
    draw.rectangle([(80, 95), (280, 125)], fill=(45, 25, 20), outline=(200, 90, 50))
    draw.text((95, 100), "PHYSICAL DILEMMA", fill=ACCENT_RED, font=get_font(13))
    draw.text((80, 135), "冰淇淋烤箱悖论 (Ice Cream in Oven)", fill=ACCENT_RED, font=get_font(21))
    
    draw.text((80, 185), "• 烤箱环境：外界主流燃气温度 1727 度", fill=TEXT_MAIN, font=get_font(16))
    draw.text((80, 225), "• 冰淇淋体：镍基合金在 1150 度 丧失机械强度", fill=TEXT_MUTED, font=get_font(15))
    draw.text((80, 265), "• 绝杀要求：不许融化，而且还要承受超大负荷！", fill=ACCENT_GOLD, font=get_font(15))
    
    cx, cy = 340, 440
    ang = frame_idx * 0.28
    for k in range(8):
        ba = ang + k * (2 * math.pi / 8)
        bx = cx + math.cos(ba) * 75
        by = cy + math.sin(ba) * 75
        draw.line([(cx, cy), (bx, by)], fill=ACCENT_TEAL, width=5)
    draw.ellipse([(cx - 20, cy - 20), (cx + 20, cy + 20)], fill=ACCENT_GOLD)
    draw.text((250, 540), "转子高速旋转 15,000 RPM", fill=ACCENT_GOLD, font=get_font(15))

    draw.rectangle([(690, 95), (890, 125)], fill=(25, 45, 38), outline=CARD_BORDER_SOLID)
    draw.text((705, 100), "EXTREME CENTRIFUGAL LOAD", fill=ACCENT_GOLD, font=get_font(13))
    draw.text((690, 135), "极端力学载荷：每片叶片拉挂大卡车", fill=TEXT_MAIN, font=get_font(21))
    
    stats = [
        ("15,000 RPM", "转子超高速旋转", "叶尖线速度超越声速，离心加速度超数万 G"),
        ("20 ~ 30 吨", "单个叶片离心拉力", "相当于每片仅几百克的叶片下悬挂一辆重型大货车"),
        ("100+ 大气压", "燃烧室高温高压冲击", "超临界强流体持续冲刷冲蚀叶片前缘"),
    ]
    for j, (num, label, desc) in enumerate(stats):
        yy = 180 + j * 130
        draw.rectangle([(690, yy), (WIDTH - 80, yy + 110)], fill=CARD_BG, outline=(35, 55, 45), width=1)
        draw.text((710, yy + 12), num, fill=ACCENT_GOLD, font=get_font(26))
        draw.text((710, yy + 50), label, fill=TEXT_MAIN, font=get_font(16))
        draw.text((710, yy + 76), desc, fill=TEXT_MUTED, font=get_font(13))
        
    draw_footer(draw, SCENES[1]["subtitle"])
    return img

def render_scene_3(frame_idx, total_frames):
    img = bg_images[3].copy()
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(overlay)
    
    d_ov.rectangle([(50, 75), (630, HEIGHT - 95)], fill=PANEL_BG, outline=(180, 60, 40, 200), width=1)
    d_ov.rectangle([(660, 75), (WIDTH - 50, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 3, "03 / 救命绝技一：像钻石一样——单晶高温合金")
    
    draw.rectangle([(80, 95), (280, 125)], fill=(45, 20, 20), outline=(200, 60, 40))
    draw.text((95, 100), "POLYCRYSTAL GRAIN", fill=ACCENT_RED, font=get_font(13))
    draw.text((80, 135), "[传统工艺] 普通多晶金属 (Polycrystal)", fill=ACCENT_RED, font=get_font(20))
    draw.text((80, 168), "由无数小晶粒拼接而成，存在大量【晶界】弱点", fill=TEXT_MUTED, font=get_font(14))
    
    box_l, box_t, box_r, box_b = 90, 205, 590, 480
    draw.rectangle([(box_l, box_t), (box_r, box_b)], fill=(20, 14, 14), outline=(60, 30, 30))
    grains = [
        [(140, 205), (220, 335), (170, 480)],
        [(290, 205), (260, 355), (340, 480)],
        [(430, 205), (390, 305), (470, 480)],
        [(90, 335), (220, 335), (390, 305), (590, 325)],
    ]
    for g in grains:
        draw.line(g, fill=(180, 70, 60), width=3)
        
    crack_prog = min(1.0, (frame_idx % (FPS * 2)) / (FPS * 2))
    crack_x = int(220 + crack_prog * 90)
    crack_y = int(335 + crack_prog * 75)
    draw.line([(220, 335), (crack_x, crack_y)], fill=(255, 230, 80), width=4)
    draw.text((230, 395), "[断裂隐患] 高温下沿晶界断裂！", fill=ACCENT_RED, font=get_font(16))
    draw.text((80, 520), "• 致命机理：在离心拉应力下，微裂纹极易沿晶界滑移撕裂", fill=TEXT_MUTED, font=get_font(14))

    draw.rectangle([(690, 95), (890, 125)], fill=(20, 45, 40), outline=CARD_BORDER_SOLID)
    draw.text((705, 100), "SINGLE CRYSTAL (SX)", fill=ACCENT_TEAL, font=get_font(13))
    draw.text((690, 135), "[核心突破] 单晶高温合金 (Single Crystal)", fill=ACCENT_TEAL, font=get_font(20))
    draw.text((690, 168), "整片叶片生长为单一晶体，【彻底零晶界】", fill=TEXT_MUTED, font=get_font(14))
    
    r_box_l, r_box_t, r_box_r, r_box_b = 700, 205, 1200, 480
    draw.rectangle([(r_box_l, r_box_t), (r_box_r, r_box_b)], fill=(12, 22, 20), outline=(30, 80, 70))
    for gx in range(730, 1180, 36):
        for gy in range(235, 460, 36):
            draw.ellipse([(gx - 3, gy - 3), (gx + 3, gy + 3)], fill=ACCENT_TEAL)
            draw.line([(gx, gy), (gx + 36, gy)], fill=(45, 117, 105), width=1)
            draw.line([(gx, gy), (gx, gy + 36)], fill=(45, 117, 105), width=1)
    draw.text((810, 395), "[结构特性] 像整块天然钻石般坚固", fill=ACCENT_TEAL, font=get_font(16))
    
    draw.text((690, 520), "• 制造工艺：螺旋选晶法 (Spiral Selector) 阻挡所有杂晶", fill=ACCENT_GOLD, font=get_font(14))
    draw.text((690, 550), "• 极致性能：消除晶界后，抗高温蠕变寿命提升数十倍！", fill=TEXT_MAIN, font=get_font(14))
    
    draw_footer(draw, SCENES[2]["subtitle"])
    return img

def render_scene_4(frame_idx, total_frames):
    img = bg_images[4].copy()
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(overlay)
    
    d_ov.rectangle([(50, 75), (660, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    d_ov.rectangle([(690, 75), (WIDTH - 50, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 4, "04 / 救命绝技二：穿上陶瓷宇航服——热障涂层 (TBC)")
    
    draw.rectangle([(80, 95), (280, 125)], fill=(45, 35, 20), outline=(200, 140, 50))
    draw.text((95, 100), "COATING CUTAWAY", fill=ACCENT_GOLD, font=get_font(13))
    draw.text((80, 135), "[微观截面] 热障涂层与温度梯度骤降", fill=ACCENT_GOLD, font=get_font(20))
    
    draw.rectangle([(80, 175), (630, 240)], fill=(180, 50, 30), outline=(220, 80, 40))
    draw.text((100, 195), "超高温主流燃气 (Hot Gas Flow) : 1700 度", fill=(255, 240, 220), font=get_font(17))
    
    draw.rectangle([(80, 240), (630, 330)], fill=(220, 190, 120), outline=(240, 220, 160))
    draw.text((100, 260), "陶瓷表层 (YSZ 钇稳定氧化锆，仅 0.25mm)", fill=(30, 25, 15), font=get_font(17))
    draw.text((100, 290), "导热系数极低 (k < 1.5) 剧烈降温超过 170 度", fill=(80, 60, 20), font=get_font(13))
    
    draw.rectangle([(80, 330), (630, 395)], fill=(100, 130, 120), outline=(130, 160, 150))
    draw.text((100, 350), "金属粘结层 (MCrAlY Bond Coat) : 缓解热应力膨胀", fill=TEXT_MAIN, font=get_font(16))
    
    draw.rectangle([(80, 395), (630, 500)], fill=(40, 55, 50), outline=(60, 85, 75))
    draw.text((100, 425), "单晶基体金属 (Superalloy Substrate)", fill=ACCENT_TEAL, font=get_font(17))
    draw.text((100, 455), "金属表面实际温度降至安全区: 980 度", fill=ACCENT_GOLD, font=get_font(17))
    
    draw.text((80, 525), "厚度仅相当于两张 A4 纸，却阻断了近 200度 的致命温差！", fill=TEXT_MUTED, font=get_font(14))

    draw.rectangle([(720, 95), (920, 125)], fill=(20, 45, 40), outline=CARD_BORDER_SOLID)
    draw.text((735, 100), "THREE CORE FEATURES", fill=ACCENT_TEAL, font=get_font(13))
    draw.text((720, 135), "[三大特性] 航发陶瓷宇航服", fill=ACCENT_TEAL, font=get_font(20))
    
    props = [
        ("1. 极低导热率 (Low Conductivity)", "微观柱状晶或纳米多孔结构，死死锁住热流"),
        ("2. 耐受超千度 (High Melting Point)", "氧化锆陶瓷熔点高达 2700度，不惧烈焰"),
        ("3. 电子束物理气相沉积 (EB-PVD)", "等离子喷涂或真空物理气相沉积，纳米级紧密结合"),
    ]
    for k, (t, d) in enumerate(props):
        yy = 185 + k * 125
        draw.rectangle([(720, yy), (WIDTH - 80, yy + 105)], fill=CARD_BG, outline=(35, 55, 45), width=1)
        draw.text((740, yy + 12), t, fill=ACCENT_GOLD, font=get_font(16))
        draw.text((740, yy + 45), d, fill=TEXT_MUTED, font=get_font(14))
        
    draw_footer(draw, SCENES[3]["subtitle"])
    return img

def render_scene_5(frame_idx, total_frames):
    img = bg_images[5].copy()
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(overlay)
    
    d_ov.rectangle([(50, 75), (660, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    d_ov.rectangle([(690, 75), (WIDTH - 50, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER, width=1)
    
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 5, "05 / 救命绝技三：会呼吸的叶片——内部蛇形流道与气膜冷却")
    
    draw.rectangle([(80, 95), (280, 125)], fill=(20, 40, 50), outline=ACCENT_BLUE)
    draw.text((95, 100), "FILM COOLING DYNAMICS", fill=ACCENT_BLUE, font=get_font(13))
    draw.text((80, 135), "[结构剖析] 内部蛇形流道与气膜微孔", fill=ACCENT_BLUE, font=get_font(20))
    
    bx, by = 100, 185
    draw.rectangle([(bx, by), (bx + 530, by + 260)], fill=(18, 25, 22), outline=(45, 117, 105), width=2)
    
    draw.rectangle([(bx + 30, by + 30), (bx + 500, by + 90)], fill=(25, 60, 80), outline=ACCENT_BLUE)
    draw.text((bx + 60, by + 50), "压气机引出二次冷气 (600度)", fill=ACCENT_TEAL, font=get_font(17))
    
    anim_offset = (frame_idx * 4) % 30
    for hx in range(bx + 60, bx + 480, 48):
        draw.ellipse([(hx - 4, by + 26), (hx + 4, by + 34)], fill=ACCENT_GOLD)
        for ay in range(by - 20, by + 20, 15):
            draw.line([(hx, ay + anim_offset), (hx + 12, ay + anim_offset - 12)], fill=ACCENT_BLUE, width=2)
            
    draw.line([(bx, by - 8), (bx + 530, by - 8)], fill=ACCENT_BLUE, width=6)
    draw.text((bx + 110, by - 34), "[流动气膜] 贴体隔热防护毯", fill=ACCENT_BLUE, font=get_font(17))
    draw.text((80, 485), "三阶协同：内部对流换热 + 冲击冷却 + 外部气膜全覆盖！", fill=ACCENT_GOLD, font=get_font(15))

    draw.rectangle([(720, 95), (920, 125)], fill=(25, 45, 38), outline=CARD_BORDER_SOLID)
    draw.text((735, 100), "COOLING CASCADE", fill=ACCENT_GOLD, font=get_font(13))
    draw.text((720, 135), "[物理机制] 空气也能成为隔热盾牌", fill=ACCENT_GOLD, font=get_font(20))
    
    steps = [
        ("1. 引出冷气", "从高压压气机引出 600度 相对低温空气"),
        ("2. 内部蛇形换热", "带肋蛇形通道将叶片内部热量迅速带走"),
        ("3. 激光打微孔", "叶片表面激光加工数千个倾斜微小孔洞 (直经 0.5mm)"),
        ("4. 贴体气膜覆盖", "冷气喷出紧贴叶片外壁，燃气无法直接接触金属"),
    ]
    for m, (t, d) in enumerate(steps):
        yy = 185 + m * 85
        draw.rectangle([(720, yy), (WIDTH - 80, yy + 75)], fill=CARD_BG, outline=(35, 55, 45), width=1)
        draw.text((740, yy + 10), t, fill=ACCENT_TEAL, font=get_font(16))
        draw.text((740, yy + 38), d, fill=TEXT_MUTED, font=get_font(13))
        
    draw_footer(draw, SCENES[4]["subtitle"])
    return img

def render_scene_6(frame_idx, total_frames):
    img = bg_images[6].copy()
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(overlay)
    
    d_ov.rectangle([(90, 85), (WIDTH - 90, HEIGHT - 95)], fill=PANEL_BG, outline=CARD_BORDER_GOLD, width=2)
    
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw_header(draw, 6, "06 / 结语与青年使命：一代材料，一代航发")
    
    draw.text((WIDTH // 2 - 210, 115), "一代材料，一代航空发动机", fill=ACCENT_GOLD, font=get_font(30))
    draw.text((WIDTH // 2 - 160, 160), "工业皇冠上的明珠 · 终极工程之美", fill=ACCENT_TEAL, font=get_font(19))
    
    summaries = [
        ("01 单晶高温合金", "消灭所有晶界，获得极强的高温抗蠕变与抗疲劳寿命"),
        ("02 陶瓷热障涂层", "0.25 毫米纳米陶瓷，强力阻隔近 200度 致命温差"),
        ("03 贴体气膜冷却", "精巧内部蛇形流道与万千微孔，用冷气织造流动防护毯"),
        ("04 青年报国担当", "西交大能动强基 · 掌握 AI 代理与 CFD 优化，投身两机国家战略！"),
    ]
    for idx, (t, d) in enumerate(summaries):
        yy = 215 + idx * 72
        draw.rectangle([(130, yy), (WIDTH - 130, yy + 60)], fill=CARD_BG, outline=(35, 55, 45), width=1)
        draw.text((150, yy + 14), t, fill=ACCENT_GOLD, font=get_font(18))
        draw.text((360, yy + 16), d, fill=TEXT_MAIN, font=get_font(16))
        
    draw.line([(130, 520), (WIDTH - 130, 520)], fill=(45, 117, 105, 160), width=1)
    draw.text((WIDTH // 2 - 180, 540), "周至县九峰初中科普课件 · 孙承泽制作", fill=TEXT_MUTED, font=get_font(17))
    
    draw_footer(draw, SCENES[5]["subtitle"])
    return img

def render_scene_frame(scene, frame_idx, total_frames):
    if scene["id"] == 1:
        return render_scene_1(frame_idx, total_frames)
    elif scene["id"] == 2:
        return render_scene_2(frame_idx, total_frames)
    elif scene["id"] == 3:
        return render_scene_3(frame_idx, total_frames)
    elif scene["id"] == 4:
        return render_scene_4(frame_idx, total_frames)
    elif scene["id"] == 5:
        return render_scene_5(frame_idx, total_frames)
    else:
        return render_scene_6(frame_idx, total_frames)

print("1. Generating 6 individual scene video clips with real voiceover...")

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
