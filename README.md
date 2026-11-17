# Mercury Across Empires — Digital Archive v0.1

朱砂与水银历史史料试验库。在线检索原始历史文献短摘录、书目、研究概要和出处链接。

**网站：** https://jinjuwu01.github.io/mercury-archive/

这是**试验版本**：18 条记录，涵盖 7 部历史著作或学术资料，并非 18 份完成 OCR 的全文档案。部分摘录来自在线转录，尚未与原始影像核对，不应直接用作正式学术引文。两条版权状态待确认的转录仅展示元数据，不提供转录原文。

## 部署

在仓库 **Settings → Pages** 中将 Source 设为 **Deploy from a branch**，选择 `main` 和 `/(root)`，保存即可。入口为根目录的 `index.html`，无需构建、数据库服务器或 API Key。

## 中英文同时显示 / Simultaneous Chinese and English

本站**不再使用语言切换按钮**。中文和英文始终同时出现：

- 导航、按钮、筛选、年代和栏目标签以“中文 / English”并列显示；
- 较长的介绍文字按中文、英文上下分段显示；
- 每条记录保留中文标题和英文标题、原文摘录和英文研究概要；
- 详情页的研究备注分别显示中文和英文，馆藏、分类及时间元数据也可同时显示两种语言；
- 搜索同时支持中文和英文关键词，并保留浏览器中的原有收藏与私人笔记。

**学术说明：** `en_summary` 是英文研究概要，不是古文原文的逐字译文。史料原文会保持原来的语言，避免把概述误当成翻译。新增记录如果还没有英文标题或研究备注，应逐步补齐，不能自动保证所有新增字段都具有双语内容。

- `i18n.js`：网站界面中英文标签、分类及年代译名、现有 18 条史料的英文研究备注，以及 About 页英文介绍。
- `index.html`：同时显示双语的页面布局及搜索、筛选、收藏逻辑。
- `data/records.csv`：逐条史料的原文、中文标题（`title`）、英文标题（`en_title`）和英文研究概要（`en_summary`）。

## 图像馆 / Image gallery

导航中的 **图像 / Images** 页面根据上传的 `Optional Supporting Materials.pdf` 建立了四条图像资料索引：

1. 卜弥格 Michael Boym 的贵州地图（约 1652–1655；梵蒂冈图书馆 Borg. cin. 531，fol. 17r）。
2. 清代约 1820 年广州画师的 `Putting in Mercury`（大英图书馆 Add.Or.2363）。
3. 文俶 `金石昆蟲草木狀` 中朱砂、炼汞及汞粉的三幅图（1617–1620；台湾国家图书馆藏号 06921）。
4. 万山传统炼汞现代照片（Li et al. 2023, *Industrial Archaeology Review* 45.2, fig. 4）——由于重印许可有待确认，**只展示书目信息与出版者链接，不公开复制摄影作品**。

`assets/historical-figures.svg` 是从用户提供的三组历史图像提取、压缩后生成的**低分辨率联系图**（sprite）；网页用 CSS 显示各组的独立缩略图。网页与 `assets/FIGURE_CREDITS.md` 保存完整馆藏出处。馆藏数字图像可能另有使用条件，在二次出版或大规模复制前须核实。

## 数据更新

1. 编辑 `data/records.csv`（UTF-8 编码），为新增记录设置唯一且永久不变的 `id`。
2. 运行 `python scripts/import_csv.py`，同步生成 `data/records.js` 和 `data/records.json`。
3. 将 CSV、JS、JSON 的更改提交到 GitHub 的 `main` 分支。
4. 浏览器自动从 `data/records.js` 载入可检索条目。仅修改 CSV 不会直接更新网页。

## 文件结构

- `index.html`：静态网站与中英文双语展示逻辑
- `i18n.js`：中英文界面与研究备注翻译
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
