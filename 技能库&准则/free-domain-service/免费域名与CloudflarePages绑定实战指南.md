# 免费域名与 Cloudflare Pages 自定义绑定实战指南

> **适用场景**：将我们部署在 Cloudflare Pages 的风电场偏航优化静态平台（默认临时域名：`https://wind-farm-viz.pages.dev/`），绑定为一个专属、独立、好记的免费域名（如 `https://wind-farm-viz.dpdns.org/` 或 `https://wind-farm.qzz.io/`）。

---

## 一、 核心操作流程（5 分钟完成）

### 步骤 1：在 DigitalPlat 申请免费域名
1. 访问控制台：[https://dash.domain.digitalplat.org/](https://dash.domain.digitalplat.org/)；
2. 注册并登录账号，进入 `Register Domain`；
3. 查询心仪的前缀（例如 `wind-farm-viz` 或 `yaw-opt`），选择后缀 `.dpdns.org` 或 `.qzz.io`，提交免费注册。

### 步骤 2：在 Cloudflare 中添加站点并获取 NS 地址
1. 登录你的 [Cloudflare Dashboard](https://dash.cloudflare.com/)；
2. 点击右上角 `+ Add a site`，输入刚才注册的完整域名（如 `wind-farm-viz.dpdns.org`）；
3. 选择免费计划（Free Plan），Cloudflare 会给出两组 NS 服务器地址（例如 `alina.ns.cloudflare.com` / `dave.ns.cloudflare.com`）。

### 步骤 3：在 DigitalPlat 设置 Nameservers
1. 返回 DigitalPlat 控制台，找到刚才注册的域名；
2. 进入 `Nameservers` 管理，选择 `Custom Nameservers`；
3. 将 Cloudflare 分配的两条 NS 地址填入并保存。

### 步骤 4：在 Cloudflare Pages 绑定自定义域名
1. 在 Cloudflare 控制台进入 `Workers & Pages` $\to$ 打开 `wind-farm-viz` 项目；
2. 切换到 `Custom domains` 选项卡，点击 `Set up a custom domain`；
3. 输入 `wind-farm-viz.dpdns.org` 并点击 `Continue`；
4. Cloudflare 会自动在其 DNS 区域内添加一条 CNAME 记录，指向 `wind-farm-viz.pages.dev`；
5. 点击 `Activate domain`，系统会自动签发免费 Universal SSL 证书。

---

## 二、 验证与生效
- 等待 2~5 分钟 DNS 全球广播扩散；
- 在终端运行 `dig +short wind-farm-viz.dpdns.org` 验证解析；
- 浏览器直接访问 `https://wind-farm-viz.dpdns.org/`，即可看到带安全绿锁的完整风电场偏航优化可视化大创平台！
