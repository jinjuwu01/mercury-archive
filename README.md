# Mercury Across Empires — Digital Archive v0.1

朱砂与水银历史史料试验库。在线检索原始历史文献短摘录、书目、研究概要和出处链接。

**网站：** https://jinjuwu01.github.io/mercury-archive/

这是**试验版本**：19 条记录，涵盖 8 部历史著作或学术资料，并非 18 份完成 OCR 的全文档案。部分摘录来自在线转录，尚未与原始影像核对，不应直接用作正式学术引文。两条版权状态待确认的转录仅展示元数据，不提供转录原文。

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

- `i18n.js`：网站界面中英文标签、分类及年代译名、现有 19 条史料的英文研究备注，以及 About 页英文介绍。
- `index.html`：同时显示双语的页面布局及搜索、筛选、收藏逻辑。
- `data/records.csv`：逐条史料的原文、中文标题（`title`）、英文标题（`en_title`）和英文研究概要（`en_summary`）。

## 文俶图像史料 / Wen Shu visual source

原先的 **图像 / Images** 独立栏目及 Boym 地图、1820 年银朱制造图、现代万山炼汞照片均已从网站撤下。现在只保留文俶《金石昆蟲草木狀》（1617–1620）三幅史料图像，并作为可检索条目 **MRA-0019** 收录于 **检索 / Search**：

- 辰州丹砂 / Chenzhou cinnabar
- 取水銀煉砂 / Extracting mercury from cinnabar
- 水銀粉 / Mercury powder

三张图现在**直接显示在 `MRA-0019` 的普通 Search 检索结果卡片中**，不再使用单独的“新收录的历史文献”板块。首页 Hg 旁保留“辰州丹砂”。为避免浏览器限制 SVG 中嵌入的图像，网页通过 `assets/wenshu-visible.css` 直接加载 WebP 图片；点击图片仍可查看单张大图。

三张高分辨率图像由研究者提供、优化后分别保存在 `assets/wenshu-chenzhou-cinnabar.svg`、`assets/wenshu-taking-mercury.svg` 与 `assets/wenshu-mercury-powder.svg`；网页上的图像可点击在新标签中打开大图。首页 Hg 标志旁也显示“辰州丹砂”。原文图像与研究概要应区分；史料图像不是现代实验指南。

馆藏：文俶，《金石昆蟲草木狀》，明萬曆 45–48 年（1617–1620），27 卷 12 冊，臺北國家圖書館特藏編號 **06921**。<https://rbook.ncl.edu.tw/NCLSearch/Selection/Details/38>。有关馆藏原件与数字图像使用条件，请查阅 `assets/FIGURE_CREDITS.md`。

## 数据更新

1. 编辑 `data/records.csv`（UTF-8 编码），为新增记录设置唯一且永久不变的 `id`。
2. 运行 `python scripts/import_csv.py`，同步生成 `data/records.js` 和 `data/records.json`。
3. 将 CSV、JS、JSON 的更改提交到 GitHub 的 `main` 分支。
4. 浏览器自动从 `data/records.js` 载入可检索条目。仅修改 CSV 不会直接更新网页。

## 文件结构

- `index.html`：静态网站与中英文双语展示逻辑
- `i18n.js`：中英文界面与研究备注翻译
- `data/records.csv`：主编辑数据，包含 `image_paths` 与中英文图注字段
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
