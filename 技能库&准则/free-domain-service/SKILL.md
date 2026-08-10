---
name: free-domain-service
description: 基于 DigitalPlat FreeDomain (DigitalPlatDev/FreeDomain) 的免费顶级二级域名申请、自定义 Nameserver 委托、Cloudflare DNS 解析托管及 Cloudflare Pages / GitHub Pages 自定义域名（Custom Domain）无缝绑定指南与操作规范。
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
metadata:
  upstream: https://github.com/DigitalPlatDev/FreeDomain
  dashboard: https://dash.domain.digitalplat.org/
  extensions: [.dpdns.org, .us.kg, .qzz.io, .xx.kg, .qd.je]
---

# DigitalPlat FreeDomain 免费域名与托管服务指南

> **核心作用**：为科研项目（如风电场偏航优化静态平台）提供免费、稳定、支持自定义 NS/DNS/CNAME 的独立域名，并无缝接入 Cloudflare 边缘 CDN 与 SSL 证书。

---

## 一、 支持的免费域名后缀
- `.dpdns.org` (推荐：工科/学术/开发)
- `.qzz.io` (推荐：现代 Web 应用/三维可视化)
- `.us.kg` / `.xx.kg` / `.qd.je`

## 二、 4 步无缝接入 Cloudflare Pages

1. **注册与域名申请**：访问 [DigitalPlat Dashboard](https://dash.domain.digitalplat.org/)，注册并认领专属域名（例如 `wind-farm-viz.dpdns.org`）；
2. **NS 委托托管到 Cloudflare**：在 DigitalPlat 域名控制面板将 Nameservers 设置为 Cloudflare 分配的 NS 地址（如 `aria.ns.cloudflare.com`, `bob.ns.cloudflare.com`）；
3. **Cloudflare Pages 添加自定义域名**：在 Cloudflare 控制台选择 `wind-farm-viz` Pages 项目，点击 `Custom Domains` $\to$ 输入 `wind-farm-viz.dpdns.org`；
4. **全自动 CNAME 路由与 HTTPS SSL 颁发**：Cloudflare 自动完成 DNS 记录注入与免费 SSL 证书签名（通常在 2~5 分钟内生效）。
