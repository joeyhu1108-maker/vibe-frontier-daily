const PATHS = {
  components: {
    index: "01",
    duration: "3 LESSONS · 90 MIN",
    title: "从一张静态界面，拆出一个可靠组件",
    description: "先区分内容、结构、状态与行为，再决定哪些差异应该变成属性，哪些应该保留为另一个组件。最后用真实边界状态检查它是否成立。",
    lessons: ["建立状态矩阵", "定义属性与组合边界", "键盘、触控与错误态验收"],
    output: "一个含 6 种状态、可在手机上使用的 Button / Card 组件"
  },
  system: {
    index: "02",
    duration: "3 LESSONS · 120 MIN",
    title: "把零散视觉值，改写成团队能使用的语言",
    description: "从真实界面审计开始，先建立 Primitive，再把颜色、空间和排版改写成 Semantic Token。组件只消费语义，不直接绑定某个色值。",
    lessons: ["界面审计与视觉库存", "Primitive → Semantic Token", "组件文档与变更规则"],
    output: "一份 Token 表、6 个核心组件与对应的使用 / 禁用说明"
  },
  motion: {
    index: "03",
    duration: "3 LESSONS · 100 MIN",
    title: "让动效表达状态，而不是制造噪音",
    description: "先用 CSS 处理局部反馈，再判断是否需要 Motion、GSAP、Rive 或 3D。每段运动都必须说明触发条件、状态变化、结束位置与 reduced-motion 降级。",
    lessons: ["反馈、转场、叙事三层模型", "时间、缓动与空间连续性", "性能预算与静态降级"],
    output: "一个含 Hover、页面转场与滚动段落的动效原型"
  },
  workflow: {
    index: "04",
    duration: "3 LESSONS · 90 MIN",
    title: "把审美判断写进 AI 可以执行的工作流",
    description: "Prompt 不只描述风格。它要包含目标、输入、结构、视觉规则、技术约束和验收条件；生成后还要回到浏览器逐项检查，而不是把第一次结果当成成品。",
    lessons: ["从模糊愿望到设计 Brief", "按任务选择生成工具", "真实尺寸下的视觉与工程 QA"],
    output: "一份可复用 Prompt、一次生成记录与一张验收清单"
  }
};

const RESOURCES = [
  {
    name: "Figma Variables",
    category: "system",
    label: "SYSTEM / TOKENS",
    best: "设计 Token、模式与多主题",
    decision: "先用变量表达颜色、间距与语义，再让组件引用变量。适合把视觉规则从画板推进到系统。",
    boundary: "不是代码的唯一事实源",
    url: "https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma",
    accent: "#d6ff45"
  },
  {
    name: "Radix Primitives",
    category: "system",
    label: "SYSTEM / BEHAVIOR",
    best: "无样式、可访问的交互基础",
    decision: "需要 Dialog、Popover、Tabs 等复杂行为时，用它承担焦点与键盘逻辑，再自己建立视觉层。",
    boundary: "不会替你完成品牌视觉",
    url: "https://www.radix-ui.com/primitives/docs/overview/introduction",
    accent: "#ff5c35"
  },
  {
    name: "shadcn Registry",
    category: "system",
    label: "SYSTEM / AI CONTEXT",
    best: "把组件分发给项目与 AI",
    decision: "当组件已成熟且需要跨项目安装时，用 Registry 让代码、依赖与文件结构成为可读取的上下文。",
    boundary: "先有规则，再做 Registry",
    url: "https://ui.shadcn.com/docs/registry/getting-started",
    accent: "#f3f0e8"
  },
  {
    name: "Storybook",
    category: "system",
    label: "SYSTEM / DOCS + QA",
    best: "隔离开发、状态文档与测试",
    decision: "组件超过少量且状态难以在真实页面复现时，用 Stories 固化状态，并自动生成基础文档。",
    boundary: "文档仍需写使用判断",
    url: "https://storybook.js.org/docs",
    accent: "#ff7ac5"
  },
  {
    name: "v0",
    category: "visual",
    label: "VISUAL / GENERATE",
    best: "React 界面生成与局部视觉调整",
    decision: "已有清晰页面目标、Tailwind 规则或 shadcn Registry 时，适合快速生成并在预览中选择元素调整。",
    boundary: "生成后必须回到代码和 QA",
    url: "https://v0.dev/docs/design-systems",
    accent: "#ffffff"
  },
  {
    name: "Lovable",
    category: "visual",
    label: "VISUAL / DIRECTIONS",
    best: "先比较视觉方向再进入构建",
    decision: "目标还不够具象时，先生成多种视觉方向，确定排版、颜色与布局语言，再推进完整产品。",
    boundary: "设计系统能力受方案限制",
    url: "https://docs.lovable.dev/features/design-guidance",
    accent: "#e6a8ff"
  },
  {
    name: "Replit Canvas",
    category: "visual",
    label: "VISUAL / PLAN",
    best: "在代码前比较页面结构与变体",
    decision: "适合把目标、视觉方向、范围与数据结构一起写入计划，并用 Canvas 看不同界面方案。",
    boundary: "发布后仍需验证公开 URL",
    url: "https://docs.replit.com/learn/projects-and-artifacts/project-editor",
    accent: "#ff7a22"
  },
  {
    name: "Onlook",
    category: "visual",
    label: "VISUAL / DIRECT EDIT",
    best: "直接在真实 DOM 上调 React / Tailwind",
    decision: "代码已经存在，但需要像设计工具一样拖拽、改样式并把结果写回代码时最合适。",
    boundary: "复杂行为仍应在代码中判断",
    url: "https://docs.onlook.com/getting-started/core-features",
    accent: "#82ffba"
  },
  {
    name: "Motion",
    category: "motion",
    label: "MOTION / INTERFACE",
    best: "React、Vue 与原生 Web 界面动效",
    decision: "需要手势、进入离开、布局或滚动响应，又不想先建立复杂时间轴时，从 Motion 开始。",
    boundary: "先确认 CSS 是否已经足够",
    url: "https://motion.dev/docs/quick-start",
    accent: "#fff312"
  },
  {
    name: "GSAP ScrollTrigger",
    category: "motion",
    label: "MOTION / SCROLL",
    best: "精细时间轴、Pin、Scrub 与滚动叙事",
    decision: "当多个对象必须按照同一进度连续编排，或需要可视化起止标记时，使用 ScrollTrigger。",
    boundary: "不要让滚动失去原生可控感",
    url: "https://gsap.com/docs/v3/Plugins/ScrollTrigger/",
    accent: "#b9ff66"
  },
  {
    name: "Rive",
    category: "motion",
    label: "MOTION / STATE MACHINE",
    best: "可交互矢量动画与状态机",
    decision: "一个角色、图标或产品演示需要根据输入切换状态，而不是只播放一段固定视频时使用。",
    boundary: "选择合适的 Canvas / WebGL runtime",
    url: "https://rive.app/docs/runtimes/web/web-js",
    accent: "#33d6b5"
  },
  {
    name: "dotLottie",
    category: "motion",
    label: "MOTION / ASSET",
    best: "跨框架播放轻量动画资产",
    decision: "动效已由设计师产出为 .lottie 或 JSON，需要在网页中控制播放、主题或状态时使用。",
    boundary: "先核对所需 AE 特性是否支持",
    url: "https://docs.lottiefiles.com/en/runtimes/distributions/web-component",
    accent: "#00ddb3"
  },
  {
    name: "Spline",
    category: "motion",
    label: "3D / VISUAL AUTHORING",
    best: "可视化制作并导出交互 3D 场景",
    decision: "需要快速制作一个有事件和动画的 3D 主视觉，并导出到 Vanilla、React 或 Three.js 时使用。",
    boundary: "移动端必须准备画质与静态降级",
    url: "https://docs.spline.design/exporting-your-scene/web/exporting-as-code",
    accent: "#a990ff"
  },
  {
    name: "React Three Fiber",
    category: "motion",
    label: "3D / ENGINEERING",
    best: "把 Three.js 场景写成 React 组件",
    decision: "3D 场景需要进入 React 状态、复用组件并和产品 UI 深度联动时使用。",
    boundary: "它不是无代码 3D 工具",
    url: "https://r3f.docs.pmnd.rs/getting-started/introduction",
    accent: "#ef8aff"
  },
  {
    name: "View Transition API",
    category: "motion",
    label: "MOTION / NATIVE WEB",
    best: "页面或视图之间的连续转场",
    decision: "先用浏览器原生机制处理同页或跨页的视图变化，再根据兼容性增加渐进增强。",
    boundary: "核对浏览器兼容并保留无动画路径",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API",
    accent: "#69a6ff"
  },
  {
    name: "MotionSites",
    category: "reference",
    label: "REFERENCE / PROMPTS",
    best: "通过动效预览浏览网站 Prompt",
    decision: "借它学习预览优先、分类与复制机制；使用具体样例时保留来源，并把 Prompt 改写成自己的目标与约束。",
    boundary: "不复制付费内容、品牌或整站源码",
    url: "https://motionsites.ai/",
    accent: "#fe5f46"
  }
];

const PROMPT_SITES = [
  {
    name: "Jiro",
    url: "https://jiro.build/",
    mode: "full",
    type: "整站 / 区块",
    access: "免费筛选 + 付费",
    best: "按行业与页面区块寻找完整 Landing Page、Header、Pricing、FAQ 等 Prompt。",
    note: "分类最接近真实建站任务，适合从单一区块开始拼页面。",
    accent: "#8f7cff"
  },
  {
    name: "21st.dev",
    url: "https://21st.dev/",
    mode: "component",
    type: "组件 / 区块",
    access: "每天 2 次免费复制",
    best: "12,000+ React 组件、模板与主题，每个组件都提供 AI-ready Prompt。",
    note: "Prompt 会把组件落进现有代码库，最适合 Codex、Claude Code 与 Cursor。",
    accent: "#ffffff"
  },
  {
    name: "VibeUI",
    url: "https://vibeui.online/",
    mode: "component",
    type: "结构 Prompt",
    access: "免费 / 无需登录",
    best: "92 个页面区块结构 Prompt，配合你自己的参考截图决定视觉风格。",
    note: "它给骨架而不是套皮，适合避免结构含糊。",
    accent: "#5eb7ff"
  },
  {
    name: "MotionSites",
    url: "https://motionsites.ai/",
    mode: "full",
    type: "整站 / 动效",
    access: "少量免费 + 付费",
    best: "高运动感 Hero、Landing Page、3D 与创意作品集的完整页面 Prompt。",
    note: "规格很细，适合学动效参数；先从免费样例判断是否值得购买。",
    accent: "#ff5c35"
  },
  {
    name: "HeroPrompts",
    url: "https://heroprompts.io/",
    mode: "full",
    type: "Hero / 首屏",
    access: "免费浏览 + 付费",
    best: "只解决高质量首屏：构图、字体、材质、灯光与进入动效。",
    note: "范围窄但聚焦；适合先把官网第一屏做对。",
    accent: "#ffb14a"
  },
  {
    name: "UIVibes",
    url: "https://uivibes.pro/",
    mode: "component",
    type: "动效组件",
    access: "部分免费 + 付费",
    best: "按钮、卡片、背景、文字效果与 Hero 的生产级实现 Prompt。",
    note: "组件规模不大但目标清晰，适合快速补一个局部效果。",
    accent: "#54e6b1"
  },
  {
    name: "UIPrompt",
    url: "https://uiprompt.app/",
    mode: "system",
    type: "设计系统 / UI",
    access: "可试用 + 付费",
    best: "先定义颜色、字体、组件风格与技术栈，再导出带项目上下文的 Prompt。",
    note: "更适合已有产品，不容易生成一套与品牌无关的通用皮肤。",
    accent: "#ff89c0"
  },
  {
    name: "uWarp",
    url: "https://www.uwarp.design/design-prompts",
    mode: "system",
    type: "风格 / 系统",
    access: "免费复制",
    best: "从 30 种视觉风格中复制包含角色、Token、布局与反例的设计系统 Prompt。",
    note: "适合快速比较方向；复制后仍要替换成真实品牌与内容。",
    accent: "#ffd84c"
  },
  {
    name: "FramingUI",
    url: "https://framingui.com/",
    mode: "system",
    type: "主题 / Agent",
    access: "开源 / MCP",
    best: "选择主题与产品屏幕，复制 Prompt 或让 Agent 通过 MCP 使用同一套系统。",
    note: "适合把一次 Prompt 升级为可持续使用的界面约束。",
    accent: "#a8ff78"
  },
  {
    name: "TurnConcepts",
    url: "https://turnconcepts.com/",
    mode: "system",
    type: "产品概念 / QA",
    access: "免费浏览",
    best: "把 UI 参考、产品概念、无障碍与交付检查写成可复制的工作 Prompt。",
    note: "不只追求一张好看的图，也覆盖真实产品工作。",
    accent: "#b3a4ff"
  },
  {
    name: "Vechooool",
    url: "https://vechooool.com/",
    mode: "full",
    type: "整站 / 模板",
    access: "访问不稳定",
    best: "中文模板与设计 Token 入口；当前部分网络会出现连接超时。",
    note: "打不开时优先使用 Jiro、21st.dev 或 VibeUI，不要把它作为唯一入口。",
    accent: "#d6ff45",
    unstable: true
  }
];

const PROMPTS = [
  {
    title: "组件状态矩阵",
    category: "COMPONENT",
    use: "把一张静态截图改写成可实现、可测试的组件规格。",
    prompt: `你是一名产品设计师与前端工程师。请把下面这个【组件】整理成可实现的组件规格，而不是只描述它好不好看。

目标：说明组件在真实产品中如何工作。
输入：组件截图/链接【粘贴】；主要用户任务【填写】；技术栈【填写】。

请按顺序输出：
1. 内容结构：不可缺少的文本、图标与区域。
2. 属性模型：哪些差异应该成为 props，哪些不应该。
3. 状态矩阵：default / hover / focus-visible / active / loading / disabled / error / empty。
4. 行为：键盘、鼠标、触控、焦点进入和退出。
5. 设计 Token：只用语义名，如 color.action.primary，不写随机色值。
6. 响应式：320 / 768 / 1440 宽度下的变化。
7. 验收：列出可以在浏览器中逐项勾选的测试。

约束：不虚构未提供的业务状态；不通过缩小字号解决移动端拥挤；焦点必须可见；触控目标至少 44px。`
  },
  {
    title: "设计系统从 0 到 1",
    category: "SYSTEM",
    use: "让 AI 先做审计和决策，而不是一上来生成一堆组件。",
    prompt: `请基于我提供的【3–5 个真实页面】建立设计系统 V1。先审计，再提出系统，不要直接重画界面。

产品背景：【填写】
页面链接/截图：【粘贴】
品牌特征：【3 个准确形容词】
技术栈：【填写】

工作步骤：
1. 审计重复的颜色、字号、间距、圆角、阴影和交互模式，标记冲突。
2. 建立 Primitive Token：color / type / space / radius / elevation / motion。
3. 建立 Semantic Token：surface / text / border / action / feedback，并说明命名理由。
4. 选择 6 个最高频组件，定义 anatomy、variants、states、composition 和禁用方式。
5. 给出 Figma Variables、CSS variables 与组件 props 的一一映射。
6. 为每个组件写一条“何时用”和一条“何时不用”。
7. 输出 Storybook 所需的状态清单与视觉回归测试范围。

验收：任意新页面不应新增未经解释的颜色或间距；dark mode 只切换 Semantic Token；组件的 loading、error、empty 状态可独立演示。`
  },
  {
    title: "界面动效分级",
    category: "MOTION",
    use: "判断应该使用 CSS、Motion、GSAP、Rive 还是 3D，并写清降级。",
    prompt: `为【页面/功能】设计动效系统。请先判断信息状态，再决定工具，不要为了炫技增加动画。

用户目标：【填写】
关键状态变化：【填写】
现有技术栈：【填写】
目标设备：【填写】

请输出：
1. 反馈层：hover、press、focus、loading，优先用 CSS。
2. 转场层：元素进入/离开、布局变化、页面切换，说明是否用 Motion 或 View Transition API。
3. 叙事层：滚动时间轴、pin、scrub，只有确有因果关系时才使用 GSAP ScrollTrigger。
4. 资产层：只有需要可交互矢量状态机时使用 Rive；需要 3D 空间时才考虑 Spline / R3F。
5. 每段动效写出 trigger、from、to、duration、easing、interrupt 与结束状态。
6. reduced-motion：给出完全静态或弱动效路径。
7. 性能预算：只动画 transform / opacity 的部分；说明哪些效果应在低端移动设备关闭。

验收：键盘操作不依赖 hover；快速重复触发不会卡死；动画结束后 DOM 状态正确；关闭动画不影响任务完成。`
  },
  {
    title: "参考网站，不复制",
    category: "REFERENCE",
    use: "把“我要这种感觉”变成有边界的机制迁移。",
    prompt: `分析这个参考网站【链接】，目标是提取可迁移机制，不复制它的品牌、文案、素材、源码或标志性视觉对象。

我的项目：【说明产品、用户和页面目标】

请分四层分析：
1. 证据：只记录页面中实际可观察或可核验的结构、输入和交互。
2. 机制：说明视觉结果由什么布局、状态、时间或数据关系产生。
3. 判断：为什么这套机制服务了原网站的内容，而不是泛泛说“高级”。
4. 迁移：为我的项目改写成不同的内容、构图和视觉材料，保留机制但形成新表达。

最后列出：
- 可以借鉴的 3 个机制；
- 明确不能复制的 5 项内容；
- 320px 移动端和 prefers-reduced-motion 下的替代方案；
- 一个最小原型及其验收条件。`
  },
  {
    title: "视觉 QA 审稿",
    category: "QUALITY",
    use: "让 AI 像设计评审一样指出问题，但必须落到位置与修复。",
    prompt: `请评审这个已实现页面【本地预览或截图组】，不要重做视觉方向，只指出影响层级、任务与一致性的具体问题。

上下文：目标用户【填写】；核心任务【填写】；设计意图【填写】。

检查 1440×900、768×1024、390×844 三种尺寸：
1. 首屏 5 秒内能否知道“这是什么、给谁、下一步做什么”。
2. 排版层级：标题、正文、标签、按钮是否靠字号和空间建立稳定关系。
3. 空间构图：是否存在机械等距、无意空洞、拥挤或重心失衡。
4. 组件一致性：圆角、边框、按钮、卡片和图标是否来自同一规则。
5. 交互目标：可点击区域、hover / focus、禁用与加载状态。
6. 移动端：是否出现横向滚动、断词、过小字号或被遮挡 CTA。
7. 无障碍与性能：对比度、键盘、reduced-motion、图片尺寸与控制台错误。

输出格式：按 P0 / P1 / P2 排序；每条写“位置 → 问题 → 用户影响 → 最小修复 → 验证方式”。没有证据的偏好不要写。`
  },
  {
    title: "移动端降级策略",
    category: "RESPONSIVE",
    use: "为重动效或复杂构图建立真正可用的手机路径。",
    prompt: `把这个桌面页面【链接/截图】改写为 390×844 的移动端方案。目标不是等比例缩小，而是保留任务、证据与视觉性格。

请输出：
1. 内容优先级：必须首屏出现 / 可延后 / 可删除。
2. 构图：将多栏、绝对定位、粘性与横向内容改成手机可读的顺序。
3. 组件：触控目标、间距、字号、输入与底部安全区。
4. 动效：保留反馈，简化转场；把 WebGL、长时间轴、视频背景替换为静态关键帧或按需加载。
5. 导航：避免用水平挤压隐藏关键入口。
6. 资源预算：列出首屏必须加载的字体、图片和脚本。

验收：无横向滚动；首屏主 CTA 可见；正文不小于 15px；点击目标至少 44px；慢速网络下仍能完成核心任务；reduced-motion 下信息无损。`
  }
];

const COVER_MAP = {
  "inkwell-webgpu-water-tethys": "./vibe/covers/inkwell-webgpu-water-tethys.png",
  "last-train-records": "./vibe/covers/last-train-records.jpg",
  "filter-fabjs-2-1-1": "./vibe/covers/filter-fabjs-2-1-1.png",
  "worldseed-orbital-story-game": "./vibe/covers/worldseed-orbital-story-game.png",
  "kasane-geometric-image-approximation": "./vibe/covers/kasane-geometric-image-approximation.jpg",
  "insect-world-procedural-field-guide": "./vibe/covers/insect-world-procedural-field-guide.png",
  "luma-color-eye-experiments": "./vibe/covers/luma-color-eye-experiments.png",
  "digital-peony-webgpu-xpbd": "./vibe/covers/digital-peony-webgpu-xpbd.webp",
  "cerebrum-brain-explorer": "./vibe/covers/cerebrum-brain-explorer.webp",
  "partmode-browser-cad": "./vibe/covers/partmode-browser-cad.png",
  "prehistoric-animal-museum": "./vibe/covers/prehistoric-animal-museum.png",
  "why-zero-university": "./vibe/covers/why-zero-university.jpg"
};

const CATEGORY_LABELS = {
  system: "组件与系统",
  visual: "视觉构建",
  motion: "动效与 3D",
  reference: "灵感机制"
};

const pathDetail = document.querySelector("#path-detail");
const resourceGrid = document.querySelector("#resource-grid");
const resourceEmpty = document.querySelector("#resource-empty");
const resourceSearch = document.querySelector("#resource-search");
const promptList = document.querySelector("#prompt-list");
const promptPreview = document.querySelector("#prompt-preview");
const promptSiteGrid = document.querySelector("#prompt-site-grid");
const promptSiteEmpty = document.querySelector("#prompt-site-empty");
const promptSiteSearch = document.querySelector("#prompt-site-search");
const caseGrid = document.querySelector("#case-grid");
const candidateGrid = document.querySelector("#candidate-grid");
const candidateEmpty = document.querySelector("#candidate-empty");
const candidateSearch = document.querySelector("#candidate-search");
const caseDialog = document.querySelector("#case-dialog");
const caseDialogContent = document.querySelector("#case-dialog-content");
const toast = document.querySelector("#toast");

let activeResourceFilter = "all";
let activePromptSiteFilter = "all";
let activeCandidateFilter = "all";
let toastTimer;
let cases = [];
let candidates = [];
let selectedCandidates = new Set();

try {
  selectedCandidates = new Set(JSON.parse(localStorage.getItem("vibe-selected-candidates") || "[]"));
} catch {
  localStorage.removeItem("vibe-selected-candidates");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

async function copyText(text, successMessage = "已复制") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  showToast(successMessage);
}

function renderPath(key) {
  const path = PATHS[key];
  pathDetail.innerHTML = `
    <div>
      <div class="path-detail__meta"><span>PATH ${path.index}</span><span>${path.duration}</span></div>
      <h3>${escapeHtml(path.title)}</h3>
      <p>${escapeHtml(path.description)}</p>
      <div class="path-detail__lessons">
        ${path.lessons.map((lesson, index) => `<div><span>LESSON ${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(lesson)}</strong></div>`).join("")}
      </div>
    </div>
    <div class="path-output"><span>FINAL OUTPUT</span><strong>${escapeHtml(path.output)}</strong></div>
  `;
}

function initPaths() {
  renderPath("components");
  document.querySelectorAll(".path-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".path-tab").forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-selected", String(item === button));
      });
      renderPath(button.dataset.path);
    });
  });
}

function renderResources() {
  const query = resourceSearch.value.trim().toLocaleLowerCase("zh-CN");
  const visible = RESOURCES.filter((resource) => {
    const categoryMatch = activeResourceFilter === "all" || resource.category === activeResourceFilter;
    const text = `${resource.name} ${resource.best} ${resource.decision} ${resource.boundary} ${CATEGORY_LABELS[resource.category]}`.toLocaleLowerCase("zh-CN");
    return categoryMatch && (!query || text.includes(query));
  });

  resourceGrid.innerHTML = visible.map((resource) => `
    <a class="resource-card" href="${resource.url}" target="_blank" rel="noopener noreferrer" style="--resource-accent:${resource.accent}">
      <div class="resource-card__top"><span>${resource.label}</span><span>OFFICIAL</span></div>
      <div class="resource-card__mark" aria-hidden="true">${escapeHtml(resource.name.charAt(0))}</div>
      <h3>${escapeHtml(resource.name)}</h3>
      <p class="resource-card__best">适合：${escapeHtml(resource.best)}</p>
      <p class="resource-card__decision">${escapeHtml(resource.decision)}</p>
      <div class="resource-card__footer"><span>边界：${escapeHtml(resource.boundary)}</span><span aria-hidden="true">↗</span></div>
    </a>
  `).join("");
  resourceEmpty.hidden = visible.length > 0;
}

function initResources() {
  const count = document.querySelector("#resource-count");
  if (count) count.textContent = String(RESOURCES.length).padStart(2, "0");
  renderResources();
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeResourceFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderResources();
    });
  });
  resourceSearch.addEventListener("input", renderResources);
}

function renderPromptSites() {
  const query = promptSiteSearch.value.trim().toLocaleLowerCase("zh-CN");
  const visible = PROMPT_SITES.filter((site) => {
    const modeMatch = activePromptSiteFilter === "all" || site.mode === activePromptSiteFilter;
    const text = `${site.name} ${site.type} ${site.access} ${site.best} ${site.note}`.toLocaleLowerCase("zh-CN");
    return modeMatch && (!query || text.includes(query));
  });

  promptSiteGrid.innerHTML = visible.map((site) => {
    const index = PROMPT_SITES.indexOf(site) + 1;
    return `
      <a class="prompt-site-card${site.unstable ? " is-unstable" : ""}" href="${site.url}" target="_blank" rel="noopener noreferrer" style="--site-accent:${site.accent}">
        <div class="prompt-site-card__top"><span>${String(index).padStart(2, "0")} / ${escapeHtml(site.type)}</span><span>${escapeHtml(site.access)}</span></div>
        <div class="prompt-site-card__mark" aria-hidden="true">${escapeHtml(site.name.slice(0, 2))}</div>
        <h3>${escapeHtml(site.name)}</h3>
        <p>${escapeHtml(site.best)}</p>
        <div class="prompt-site-card__bottom"><span>${escapeHtml(site.note)}</span><strong>${site.unstable ? "尝试打开" : "打开并复制"} ↗</strong></div>
      </a>
    `;
  }).join("");
  promptSiteEmpty.hidden = visible.length > 0;
}

function initPromptSites() {
  document.querySelector("#prompt-site-count").textContent = String(PROMPT_SITES.length).padStart(2, "0");
  renderPromptSites();
  document.querySelectorAll("[data-prompt-site-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activePromptSiteFilter = button.dataset.promptSiteFilter;
      document.querySelectorAll("[data-prompt-site-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderPromptSites();
    });
  });
  promptSiteSearch.addEventListener("input", renderPromptSites);
}

function renderPrompt(index) {
  const item = PROMPTS[index];
  promptPreview.innerHTML = `
    <div class="prompt-preview__top"><span>${item.category} / ORIGINAL TEMPLATE</span><button class="copy-button" type="button" data-copy-prompt="${index}">复制 Prompt <span aria-hidden="true">＋</span></button></div>
    <h3>${escapeHtml(item.title)}</h3>
    <p class="prompt-preview__use">${escapeHtml(item.use)}</p>
    <div class="prompt-code">${escapeHtml(item.prompt)}</div>
  `;
  promptPreview.querySelector("[data-copy-prompt]").addEventListener("click", () => copyText(item.prompt, `已复制「${item.title}」`));
}

function initPrompts() {
  document.querySelector("#prompt-count").textContent = String(PROMPTS.length + 2).padStart(2, "0");
  promptList.innerHTML = PROMPTS.map((prompt, index) => `
    <button class="prompt-tab${index === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${index === 0}" data-prompt="${index}">
      <span>${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(prompt.title)}</strong><small>${prompt.category}</small></span><span aria-hidden="true">↗</span>
    </button>
  `).join("");
  renderPrompt(0);
  promptList.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      promptList.querySelectorAll("[data-prompt]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-selected", String(item === button));
      });
      renderPrompt(Number(button.dataset.prompt));
    });
  });
}

function initWorkshop() {
  const button = document.querySelector("#playground-button");
  const values = { size: "medium", tone: "primary", state: "default" };
  const labels = { default: "生成视觉方案", loading: "正在生成…", disabled: "暂不可使用" };

  document.querySelectorAll(".segmented").forEach((control) => {
    control.querySelectorAll("button").forEach((option) => {
      option.addEventListener("click", () => {
        values[control.dataset.control] = option.dataset.value;
        control.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === option));
        button.className = `playground-button playground-button--${values.size} playground-button--${values.tone}`;
        button.classList.toggle("is-loading", values.state === "loading");
        button.disabled = values.state === "disabled";
        button.querySelector("span:first-child").textContent = labels[values.state];
        button.querySelector("span:last-child").textContent = values.state === "loading" ? "" : "→";
      });
    });
  });
}

function renderCases() {
  if (!cases.length) {
    caseGrid.innerHTML = "<p>案例资料暂时无法读取，请稍后刷新。</p>";
    return;
  }
  caseGrid.innerHTML = cases.map((item, index) => `
    <article class="case-card">
      <div class="case-card__image"><img src="${COVER_MAP[item.id]}" alt="${escapeHtml(item.title)} 案例封面" loading="lazy" /><span class="case-card__index">CASE ${String(index + 1).padStart(2, "0")}</span></div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="case-card__meta">${escapeHtml(item.author)} · ${escapeHtml(item.platform)}</p>
      <p class="case-card__memory">${escapeHtml(item.memory)}</p>
      <ul class="mechanism-tags">${item.mechanisms.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
      <div class="case-actions"><button type="button" data-case="${item.id}">查看完整拆解 ↗</button><a href="${item.url}" target="_blank" rel="noopener noreferrer">打开原作 ↗</a></div>
    </article>
  `).join("");
  caseGrid.querySelectorAll("[data-case]").forEach((button) => button.addEventListener("click", () => openCase(button.dataset.case)));
}

function openCase(id) {
  const item = cases.find((entry) => entry.id === id);
  if (!item) return;
  const detailItems = [
    ["01 / WHY IT WORKS", item.why],
    ["02 / INPUT", item.input],
    ["03 / VISUAL LAYER", item.layer],
    ["04 / MOTION", item.motion],
    ["05 / PIPELINE", item.pipeline],
    ["06 / PERFORMANCE", item.performance],
    ["07 / TRANSFER", item.transfer]
  ];
  caseDialogContent.innerHTML = `
    <div class="case-dialog__body">
      <p class="case-dialog__meta">CASE LAB · ${escapeHtml(item.author)} · ${escapeHtml(item.pageTime)}</p>
      <h2 id="case-dialog-title">${escapeHtml(item.title)}</h2>
      <p class="case-dialog__lead">${escapeHtml(item.memory)}</p>
      <div class="case-dialog__grid">${detailItems.map(([label, value]) => `<div class="case-dialog__item"><span>${label}</span><p>${escapeHtml(value)}</p></div>`).join("")}</div>
      <p class="case-dialog__evidence"><strong>EVIDENCE / 证据边界</strong><br />${escapeHtml(item.evidence)}</p>
      <a class="button button--ink case-dialog__link" href="${item.url}" target="_blank" rel="noopener noreferrer">打开原作 ↗</a>
    </div>
  `;
  caseDialog.showModal();
}

async function initCases() {
  try {
    const response = await fetch("./vibe/issues.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    cases = data.issues?.[0]?.cases ?? [];
  } catch (error) {
    console.error("Failed to load case library", error);
  }
  renderCases();
  if (candidates.length) renderCandidates();
}

function matchesCandidateCategory(item, category) {
  if (category === "all") return true;
  if (category === "selected") return selectedCandidates.has(item.id);
  const mechanisms = item.mechanisms.join(" ");
  if (category === "space") return mechanisms.includes("数据变成空间") || mechanisms.includes("模型成为界面");
  if (category === "scroll") return mechanisms.includes("滚动变成镜头");
  if (category === "editorial") return mechanisms.includes("排版变成界面");
  if (category === "interaction") return mechanisms.includes("交互变成叙事");
  return true;
}

function renderCandidates() {
  const query = candidateSearch.value.trim().toLocaleLowerCase("zh-CN");
  const visible = candidates.filter((item) => {
    const text = `${item.title} ${item.author} ${item.platform} ${item.mechanisms.join(" ")}`.toLocaleLowerCase("zh-CN");
    return matchesCandidateCategory(item, activeCandidateFilter) && (!query || text.includes(query));
  });
  const deepIds = new Set(cases.map((item) => item.id));

  candidateGrid.innerHTML = visible.map((item) => {
    const index = candidates.indexOf(item) + 1;
    const selected = selectedCandidates.has(item.id);
    const cover = COVER_MAP[item.id];
    const visual = cover
      ? `<img src="${cover}" alt="${escapeHtml(item.title)} 案例预览" loading="lazy" />`
      : `<div class="candidate-card__fallback candidate-card__fallback--${index % 5}"><span>REFERENCE ${String(index).padStart(2, "0")}</span><strong>${escapeHtml(item.title)}</strong></div>`;
    return `
      <article class="candidate-card${selected ? " is-selected" : ""}">
        <a class="candidate-card__visual" href="${item.url}" target="_blank" rel="noopener noreferrer">${visual}${deepIds.has(item.id) ? '<span class="candidate-card__deep">深度拆解</span>' : ""}</a>
        <div class="candidate-card__body">
          <div class="candidate-card__meta"><span>ISSUE ${escapeHtml(item.issueNo)} · ${escapeHtml(item.dateLabel)}</span><span>${String(index).padStart(2, "0")} / ${String(candidates.length).padStart(2, "0")}</span></div>
          <h4><a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h4>
          <p>${escapeHtml(item.author)} · ${escapeHtml(item.platform)}</p>
          <ul>${item.mechanisms.slice(0, 3).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
          <div class="candidate-card__actions"><a href="${item.url}" target="_blank" rel="noopener noreferrer">打开原作 ↗</a><button type="button" data-select-candidate="${item.id}" aria-pressed="${selected}">${selected ? "已加入 ✓" : "加入候选 ＋"}</button></div>
        </div>
      </article>
    `;
  }).join("");

  document.querySelector("#candidate-result-count").textContent = `${visible.length} 个结果`;
  document.querySelector("#selected-count").textContent = String(selectedCandidates.size);
  candidateEmpty.hidden = visible.length > 0;
  candidateGrid.querySelectorAll("[data-select-candidate]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.selectCandidate;
      if (selectedCandidates.has(id)) selectedCandidates.delete(id);
      else selectedCandidates.add(id);
      localStorage.setItem("vibe-selected-candidates", JSON.stringify([...selectedCandidates]));
      renderCandidates();
      showToast(selectedCandidates.has(id) ? "已加入你的候选单" : "已移出候选单");
    });
  });
}

async function initCandidates() {
  try {
    const response = await fetch("./vibe/site-candidates.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    candidates = data.candidates ?? [];
  } catch (error) {
    console.error("Failed to load candidate library", error);
  }
  const count = String(candidates.length);
  document.querySelector("#candidate-count").textContent = count.padStart(2, "0");
  document.querySelector("#candidate-total").textContent = count;
  document.querySelectorAll("[data-candidate-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCandidateFilter = button.dataset.candidateFilter;
      document.querySelectorAll("[data-candidate-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderCandidates();
    });
  });
  candidateSearch.addEventListener("input", renderCandidates);
  renderCandidates();
}

function initDialog() {
  document.querySelector(".dialog-close").addEventListener("click", () => caseDialog.close());
  caseDialog.addEventListener("click", (event) => {
    const rect = caseDialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) caseDialog.close();
  });
}

function initSamples() {
  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", async () => {
      const original = button.textContent;
      button.textContent = "读取中…";
      button.disabled = true;
      try {
        const response = await fetch(button.dataset.sample);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        await copyText(text, "已复制 MotionSites 免费完整 Prompt");
      } catch (error) {
        console.error("Failed to copy sample", error);
        showToast("样例读取失败，请刷新后重试");
      } finally {
        button.textContent = original;
        button.disabled = false;
      }
    });
  });
}

function initCommunity() {
  const questionTemplate = `【VIBE FRONTIER 共学提问】
项目链接：
目标用户：
他们要完成的核心任务：
当前最具体的问题：
我已经尝试过：
技术 / 时间 / 设备限制：
希望这次一起拆解的部分：`;
  document.querySelector("#copy-question").addEventListener("click", () => copyText(questionTemplate, "已复制共学提问模板"));
}

initPaths();
initPromptSites();
initResources();
initPrompts();
initWorkshop();
initCases();
initCandidates();
initDialog();
initSamples();
initCommunity();
