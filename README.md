# Microsoft 365 子账户创建器（Cloudflare Worker）Microsoft 365 Sub-Account Creator (Cloudflare Worker)

一款简单易用的在线工具，可自动创建 Microsoft 365 子账户。A simple online tool to create Microsoft 365 sub-accounts automatically.  
该工具基于 Cloudflare Worker 构建，支持 Turnstile CAPTCHA 验证，并可自动生成强密码。Built as a **Cloudflare Worker** with **Turnstile CAPTCHA verification** and support for auto-generated strong passwords.

---

## 功能Features

- 通过 Microsoft Graph API 创建 Microsoft 365 子帐户Create Microsoft 365 sub-accounts via Microsoft Graph API
- 自动生成强密码Auto-generate strong passwords
- 使用 Cloudflare Turnstile 进行 CAPTCHA 验证CAPTCHA verification using Cloudflare Turnstile
- 管理员验证以防止未经授权的使用Admin verification to prevent unauthorized use

---

## 配置Configuration

```toml
name = "microsoft-account-creator"
main = "worker.js"
compatibility_date = "2025-05-09"

[vars]
MS_TENANT_ID = "YOUR_TENANT_ID"
MS_CLIENT_ID = "YOUR_CLIENT_ID"
MS_CLIENT_SECRET = "YOUR_CLIENT_SECRET"
MS_SKU_ID = "LICENSE_SKU_ID"
MS_DOMAIN = "xxx.com"
TURNSTILE_SITE_KEY = "YOUR_TURNSTILE_SITE_KEY"
TURNSTILE_SECRET_KEY = "YOUR_TURNSTILE_SECRET_KEY"
FORM_VERIFICATION_CODE = "YOUR_ADMIN_PASSWORD"
