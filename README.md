# Mercury Across Empires — Digital Archive v0.1

朱砂与水银历史史料试验库。在线检索原始历史文献短摘录、书目、研究概要和出处链接。

**网站：** https://jinjuwu01.github.io/mercury-archive/

这是**试验版本**：18 条记录，涵盖 7 部历史著作或学术资料，并非 18 份完成 OCR 的全文档案。部分摘录来自在线转录，尚未与原始影像核对，不应直接用作正式学术引文。两条版权状态待确认的转录仅展示元数据，不提供转录原文。

## 部署

在仓库 **Settings → Pages** 中将 Source 设为 **Deploy from a branch**，选择 `main` 和 `/(root)`，保存即可。入口为根目录的 `index.html`，无需构建、数据库服务器或 API Key。

## 数据更新

1. 编辑 `data/records.csv`（UTF-8 编码），为新增记录设置唯一且永久不变的 `id`。
2. 运行 `python scripts/import_csv.py`，同步生成 `data/records.js` 和 `data/records.json`。
3. 将 CSV、JS、JSON 的更改提交到 GitHub 的 `main` 分支。
4. 浏览器自动从 `data/records.js` 载入可检索条目。仅修改 CSV 不会直接更新网页。

## 文件结构

- `index.html`：静态网站
- `data/records.csv`：主编辑数据
- `data/records.js`：网页读取的 JavaScript 数据
- `data/records.json`：标准 JSON 导出
- `data/sources.csv`：文献出处清单
- `data/new_record_template.csv`：新条目表头模板
- `scripts/import_csv.py`：CSV 转网页数据脚本

## 数据与权限

- **不要向此 Public 仓库上传**尚未获授权的档案影像、私人研究笔记、API 密钥或其他敏感材料。
- 公开展示前请检查原件、现代转录服务提供方的版权或使用条件。
- 研究笔记与收藏保存在当前浏览器的 localStorage，**不是私人云端数据库**，不会同步到 GitHub，浏览器清理数据可能导致丢失。
- 这些文献的历史技术、毒性或药物用途记载不构成现代安全或医疗建议。

数据由公共史料线索整理而成；学术引用应以校验过的原版和页码为准。
