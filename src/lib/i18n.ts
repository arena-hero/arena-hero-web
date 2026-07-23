import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    brand: 'ARENA HERO', tagline: 'Persistent world. Precise orders.',
    nav: { arena: 'Arena', stats: 'Statistics', keys: 'API Keys' },
    auth: {
      welcome: 'Return to the arena', create: 'Create your operator', email: 'Email', username: 'Username', password: 'Password', confirmPassword: 'Confirm password', passwordMismatch: 'The two passwords do not match.',
      login: 'Sign in', register: 'Create account', noAccount: 'No account yet?', hasAccount: 'Already registered?',
      forgot: 'Forgot password?', github: 'Continue with GitHub', verificationSent: 'Verification link sent. Check your inbox.',
      verifyTitle: 'Verify your signal', verifying: 'Verifying email…', verified: 'Email verified. Your Core will activate on a deterministic tick boundary.',
      resetTitle: 'Reset access', sendReset: 'Send reset link', reset: 'Set new password', back: 'Back to sign in', logout: 'Sign out', resend: 'Resend verification', linkGithub: 'Link GitHub',
      githubLinkTitle: 'Connect your GitHub identity', githubLinkDescription: 'Authorize GitHub in a separate secure window. Your arena view stays open while the account is linked.', githubLinkAction: 'Continue to GitHub', githubLinkOpened: 'Complete authorization in the GitHub window.', githubLinkSuccess: 'GitHub account linked.', popupBlocked: 'The authorization window was blocked. Allow pop-ups and try again.',
      access: 'OPERATOR ACCESS', recovery: 'RECOVERY CHANNEL', githubAccess: 'GITHUB ACCESS', newOperator: 'NEW OPERATOR', newCredential: 'NEW CREDENTIAL', identityCheck: 'IDENTITY CHECK',
      loginSubtitle: 'Your Core is waiting. Continue from the next Tick.', signingIn: 'Signing in…', or: 'OR', showPassword: 'Show password', hidePassword: 'Hide password',
      usernameHelp: 'Use 3-24 lowercase letters, numbers, or underscores.', resetSubtitle: 'Enter your email and we will send a secure reset link.',
      storyLabel: 'Arena Hero introduction', storyTitle: 'A world that keeps moving.', storyBody: 'Scout the dark, build your fleet, and contest the single Champion Beacon. Every Tick leaves a permanent mark.', storyAlt: 'Arena Hero battlefield with ships, crystals, and asteroid fields', backHome: 'Back to Arena Hero home',
    },
    landing: {
      nav: { label: 'Primary navigation', gameplay: 'How it plays', fleet: 'Fleet', beacon: 'Beacon', agent: 'Agents' },
      actions: { createAccount: 'Create account', signIn: 'Sign in', enterArena: 'Enter arena' },
      hero: { title: 'Make your mark on an infinite battlefield.', body: 'Issue precise orders, grow your fleet, and fight for the only Champion Beacon.', visualLabel: 'Arena Hero live battlefield', visualAlt: 'Arena Hero tactical map with units, resources, and obstacles' },
      intro: { kicker: 'One persistent world', title: 'The world keeps moving. Every command changes what happens next.', body: 'Explore an infinite deterministic map where every player shares the same history.' },
      tick: {
        title: 'Every Tick is a decision.', body: 'A new state opens a short command window. Read the field, commit an action, and live with the result.',
        observe: { title: 'Read the field', body: 'See only what your units can currently observe.' },
        command: { title: 'Give one clear order', body: 'Move, harvest, build, repair, or attack.' },
        resolve: { title: 'Watch it resolve', body: 'Every legal action settles in the same world snapshot.' },
      },
      fleet: {
        title: 'One fleet. Four distinct roles.', body: 'Every ship has a clear job. Position and timing matter more than raw numbers.',
        core: { title: 'Core', body: 'Build, shield, migrate, and survive.' },
        worker: { title: 'Worker', body: 'Harvest and return resources.' },
        vanguard: { title: 'Vanguard', body: 'Hold ground and sweep nearby enemies.' },
        ranger: { title: 'Ranger', body: 'Strike targets before they can close in.' },
      },
      beacon: { title: 'There is only one Champion Beacon.', body: 'Find it, carry it, and defend the unit holding it. Every player can track its direction beyond the visible map.', bonus: "The carrier's Workers harvest twice as much.", alt: 'Golden Champion Beacon' },
      agent: { title: 'Command it yourself. Or automate it.', body: 'Manual and local Agent orders share one compact protocol. A manual action can override the Agent for that object.', protocolLabel: 'Agent command loop', tick: 'Announce a new Tick while commands remain closed.', state: 'Read the visible world and open the command window.', commands: 'Send the latest action for each controlled object.', received: 'Stop sending and wait for the next Tick.' },
      final: { title: 'Your Core is waiting.', body: 'Join the persistent world and make the next Tick count.' },
      footer: 'A persistent tactical world for human players and local Agents.',
    },
    errors: {
      emailNotVerified: 'Please verify your email before signing in.', invalidCredentials: 'The email or password is incorrect.',
      identityAlreadyExists: 'That email or username is already registered.', registrationFailed: 'We could not create your account. Please check your details and try again.',
      invalidOrExpiredToken: 'This link is invalid or has expired. Please request a new one.', passwordResetFailed: 'We could not reset your password. Please request a new reset link.',
      githubUnavailable: 'GitHub sign-in is not available right now.', oauthFailed: 'GitHub sign-in could not be completed.', oauthLinkRequired: 'Sign in first to link this GitHub account.',
      sessionExpired: 'Your session has expired. Please sign in again.', apiKeyFailed: 'We could not create the API key. Please try again.', apiKeyNotFound: 'That API key no longer exists.', statsUnavailable: 'Statistics are temporarily unavailable.',
      commandWindowClosed: 'The command window has closed. Wait for the next Tick.', tickMismatch: 'The Tick changed before this order arrived. Please submit it again.', invalidCommand: 'This order is not valid.', commandSuperseded: 'A newer order has already replaced this one.', commandConflict: 'This order conflicts with an earlier request.', playerNotReady: 'Your player is not ready yet. Please wait for the next Tick.', stateInvalid: 'The game state could not be read. Reconnecting…',
      generic: 'Something went wrong. Please try again.',
    },
    game: {
      resources: 'Resources', population: 'Population', upkeep: 'Next upkeep', tier: 'Population tier', status: 'Status',
      syncing: 'SYNCING TICK', open: 'ORDERS OPEN', connecting: 'CONNECTING', settling: 'SETTLING', offline: 'RECONNECTING', demo: 'DEMO SIGNAL',
      objects: 'Your assets', noSelection: 'Select a controlled object on the map', orders: 'Manual orders', submit: 'Submit orders', submitted: 'Plan received', autoSendReady: 'Each completed action is sent immediately', sendingAction: 'Sending action…', actionReceived: 'Action received', waitingNextTick: 'Waiting for the next Tick',
      center: 'Center on Core', zoomIn: 'Zoom in', zoomOut: 'Zoom out', events: 'Private events', noEvents: 'No events this tick',
      championBeacon: 'Champion Beacon', centerBeacon: 'Center on Champion Beacon', beaconGround: 'On the ground', beaconCarried: 'Carried', beaconUnknown: 'Outside current vision', beaconBonus: "The carrier's Workers harvest 2 resources per action.",
      mapResource: 'Resource deposit', mapObstacle: 'Obstacle', obstacleBlocked: 'Units cannot enter or move through this cell.',
      agent: 'Agent', manual: 'Manual', lastReceived: 'Last received', clear: 'Clear order', targetHint: 'Choose a highlighted shootable unit',
      moveHint: 'Choose any explored destination cell', moveTo: 'Move to {{x}}, {{y}}', routeTo: 'ROUTE · [{{x}}, {{y}}]', clearRoute: 'Cancel route', routeUnknown: 'That cell has not been explored yet', routeBlocked: 'No legal route to that cell right now', sweepHint: 'Choose an adjacent hostile unit to sweep',
      commandWindow: 'Command window', secondsRemaining: 'seconds remaining',
      respawningBy: 'Your Core was destroyed by {{destroyer}}. Reconstructing now.', respawningUnknown: 'Your Core was destroyed. Reconstructing now.', respawnRemaining: '{{count}} Ticks remaining', respawnProgress: 'Core reconstruction progress', respawnReady: 'Deploying on the next state…', respawnHint: 'Your units and resources were lost. A new Core and Worker will deploy automatically.',
      produceUnit: 'Produce unit', resourcesAvailable: '{{count}} available', unitCost: '{{cost}} resources',
      emptyPlan: 'No manual overrides. Agent orders remain active.', connected: 'Live', disconnected: 'Disconnected',
	      actions: { MOVE: 'Move', HARVEST: 'Harvest', DEPOSIT: 'Deposit', SWEEP: 'Sweep', SHOOT: 'Shoot', PICKUP_BEACON: 'Pick up Beacon', DROP_BEACON: 'Drop Beacon', WAIT: 'Wait', SPAWN: 'Spawn', REPAIR_SHIELD: 'Repair shield', START_MOVE: 'Move Core', CANCEL_MOVE: 'Cancel migration' },
      units: { WORKER: 'Worker', VANGUARD: 'Vanguard', RANGER: 'Ranger', CORE: 'Core' },
    },
    stats: { title: 'Operator statistics', subtitle: 'Private lifetime record', damageDealt: 'Damage dealt', damageReceived: 'Damage received', unitsDestroyed: 'Unit assists', coresDestroyed: 'Core assists', harvested: 'Harvested', deposited: 'Deposited', beaconPickups: 'Beacon pickups', beaconTicksHeld: 'Beacon ticks held', beaconBonusHarvested: 'Beacon bonus resources', spawned: 'Units spawned', lost: 'Units lost', survival: 'Core survival ticks', respawns: 'Respawns' },
    keys: { title: 'API keys', subtitle: 'Connect a local agent to the arena.', create: 'Create key', createTitle: 'Create a new API key', createDescription: 'Create a credential for an Agent or local integration. The full key will be shown once after creation.', createConfirm: 'Create API key', creating: 'Creating…', createdTitle: 'API key created', empty: 'No API keys yet.', emptyHelp: 'Create one when you are ready to connect an Agent.', copy: 'Copy key', copied: 'Copied', copySuccess: 'Copied to clipboard.', copyFailed: 'Could not copy. Select and copy the key manually.', delete: 'Delete key', deleting: 'Deleting…', deleteTitle: 'Delete this API key?', deleteDescription: 'Anything using {{key}} will immediately lose access. This cannot be undone.', deleted: 'API key deleted.', created: 'Created', lastUsed: 'Last used', never: 'Never', oneTime: 'Copy this key now. It will never be shown again.', close: 'I saved it' },
    common: { loading: 'Loading…', retry: 'Retry', cancel: 'Cancel', close: 'Close', error: 'Something went wrong', demo: 'Open demo arena', language: 'Language', account: 'Account' },
  } },
  zh: { translation: {
    brand: 'ARENA HERO', tagline: '永久世界，精确指令。',
    nav: { arena: '战场', stats: '统计', keys: 'API 密钥' },
    auth: {
      welcome: '重返战场', create: '创建操作员', email: '邮箱', username: '用户名', password: '密码', confirmPassword: '再次输入密码', passwordMismatch: '两次输入的密码不一致。',
      login: '登录', register: '创建账号', noAccount: '还没有账号？', hasAccount: '已经注册？',
      forgot: '忘记密码？', github: '使用 GitHub 继续', verificationSent: '验证链接已发送，请检查邮箱。',
      verifyTitle: '验证信号', verifying: '正在验证邮箱…', verified: '邮箱验证成功。你的 Core 会在确定性的 Tick 边界激活。',
      resetTitle: '重置访问权限', sendReset: '发送重置链接', reset: '设置新密码', back: '返回登录', logout: '退出登录', resend: '重新发送验证邮件', linkGithub: '关联 GitHub',
      githubLinkTitle: '关联你的 GitHub 身份', githubLinkDescription: '在独立的安全窗口中完成 GitHub 授权，战场画面会保持打开。', githubLinkAction: '前往 GitHub 授权', githubLinkOpened: '请在 GitHub 窗口中完成授权。', githubLinkSuccess: 'GitHub 账号已关联。', popupBlocked: '授权窗口被浏览器拦截，请允许弹出窗口后重试。',
      access: '操作员登录', recovery: '恢复访问权限', githubAccess: 'GITHUB 登录', newOperator: '新操作员', newCredential: '设置新凭据', identityCheck: '身份验证',
      loginSubtitle: '你的 Core 正在等待，从下一个 Tick 继续。', signingIn: '正在登录…', or: '或', showPassword: '显示密码', hidePassword: '隐藏密码',
      usernameHelp: '使用 3-24 位小写字母、数字或下划线。', resetSubtitle: '输入邮箱，我们会发送安全的密码重置链接。',
      storyLabel: 'Arena Hero 游戏介绍', storyTitle: '世界始终在运转。', storyBody: '探索黑暗，建立舰队，争夺唯一的冠军信标。每个 Tick 都会留下永久影响。', storyAlt: 'Arena Hero 战场中的飞船、晶体和陨石带', backHome: '返回 Arena Hero 首页',
    },
    landing: {
      nav: { label: '主导航', gameplay: '玩法', fleet: '舰队', beacon: '冠军信标', agent: 'Agent' },
      actions: { createAccount: '创建账号', signIn: '登录', enterArena: '进入战场' },
      hero: { title: '在无限战场，留下你的名字。', body: '精确下令，扩张舰队，争夺唯一的冠军信标。', visualLabel: 'Arena Hero 实时战场', visualAlt: '包含单位、资源与障碍物的 Arena Hero 战术地图' },
      intro: { kicker: '同一个永久世界', title: '世界不会等待。每一道指令都在改变下一刻。', body: '探索确定性生成的无限地图，所有玩家共同书写同一段历史。' },
      tick: {
        title: '每个 Tick 都是一次决定。', body: '收到新状态后，短暂的指令窗口随即开启。观察战场，确认行动，然后承担结果。',
        observe: { title: '观察战场', body: '你只能看到己方单位当前覆盖的视野。' },
        command: { title: '下达指令', body: '移动、采集、生产、修盾或发动攻击。' },
        resolve: { title: '同步结算', body: '所有合法行动都在同一个世界快照中结算。' },
      },
      fleet: {
        title: '一支舰队，四种职责。', body: '每种飞船都有明确任务。站位与时机比单纯堆数量更重要。',
        core: { title: 'Core', body: '生产、修盾、迁移，并设法生存。' },
        worker: { title: '工人', body: '持续采集并把资源送回 Core。' },
        vanguard: { title: '先锋', body: '控制近距离空间，横扫邻近敌人。' },
        ranger: { title: '游侠', body: '在敌人逼近前完成远程打击。' },
      },
      beacon: { title: '冠军信标，整个世界只有一个。', body: '找到它、携带它，并保护持有信标的单位。即使超出视野，所有玩家也能感知它的方向。', bonus: '持有者的工人每次采集双倍资源。', alt: '金色冠军信标' },
      agent: { title: '亲自指挥，也可以交给 Agent。', body: '手动模式与本地 Agent 共用一套紧凑协议。手动行动可以覆盖该对象的 Agent 指令。', protocolLabel: 'Agent 指令循环', tick: '宣布新 Tick，此时指令仍然关闭。', state: '读取可见世界，同时开放指令窗口。', commands: '为每个受控对象发送最新行动。', received: '停止发送，等待下一个 Tick。' },
      final: { title: '你的 Core 正在等待。', body: '进入这个永久世界，让下一个 Tick 变得重要。' },
      footer: '为真人玩家与本地 Agent 构建的永久战术世界。',
    },
    errors: {
      emailNotVerified: '请先完成邮箱验证，再登录游戏。', invalidCredentials: '邮箱或密码不正确。',
      identityAlreadyExists: '该邮箱或用户名已被注册。', registrationFailed: '账号创建失败，请检查填写内容后重试。',
      invalidOrExpiredToken: '这个链接无效或已经过期，请重新申请。', passwordResetFailed: '密码重置失败，请重新申请重置链接。',
      githubUnavailable: 'GitHub 登录暂时不可用。', oauthFailed: '未能完成 GitHub 登录。', oauthLinkRequired: '请先登录，再关联这个 GitHub 账号。',
      sessionExpired: '登录状态已过期，请重新登录。', apiKeyFailed: 'API 密钥创建失败，请重试。', apiKeyNotFound: '该 API 密钥已经不存在。', statsUnavailable: '统计数据暂时不可用。',
      commandWindowClosed: '指令窗口已经关闭，请等待下一个 Tick。', tickMismatch: '提交期间 Tick 已变化，请重新发送指令。', invalidCommand: '这条指令无效。', commandSuperseded: '这条指令已被更新的指令覆盖。', commandConflict: '这条指令与之前的请求冲突。', playerNotReady: '玩家尚未就绪，请等待下一个 Tick。', stateInvalid: '无法读取游戏状态，正在重新连接……',
      generic: '操作失败，请稍后重试。',
    },
    game: {
      resources: '资源', population: '人口', upkeep: '下 Tick 维护费', tier: '人口等级', status: '状态',
      syncing: '正在同步 TICK', open: '指令已开放', connecting: '正在连接', settling: '正在结算', offline: '正在重连', demo: '演示信号',
      objects: '己方单位', noSelection: '在地图上选择一个己方对象', orders: '手动指令', submit: '提交指令', submitted: '计划已接收', autoSendReady: '每个完成的操作都会立即发送', sendingAction: '正在发送操作……', actionReceived: '操作已接收', waitingNextTick: '等待下一个 Tick',
      center: '定位 Core', zoomIn: '放大', zoomOut: '缩小', events: '私人事件', noEvents: '本 Tick 没有事件',
      championBeacon: '冠军信标', centerBeacon: '定位冠军信标', beaconGround: '位于地面', beaconCarried: '已被携带', beaconUnknown: '不在当前视野内', beaconBonus: '携带者的工人每次采集 2 资源。',
      mapResource: '资源矿脉', mapObstacle: '障碍物', obstacleBlocked: '单位无法进入或穿过这个格子。',
      agent: 'Agent', manual: '手动', lastReceived: '最近接收', clear: '清除指令', targetHint: '选择一个高亮的可射击敌方单位',
      moveHint: '选择任意一个已探索的目的地格子', moveTo: '移动到 {{x}}, {{y}}', routeTo: '路线 · [{{x}}, {{y}}]', clearRoute: '取消路线', routeUnknown: '这个格子还没有探索', routeBlocked: '当前没有到达这个格子的合法路线', sweepHint: '选择相邻的敌方单位进行横扫',
      commandWindow: '指令窗口', secondsRemaining: '秒剩余',
      respawningBy: '你的 Core 被 {{destroyer}} 摧毁了，正在重建', respawningUnknown: '你的 Core 被摧毁了，正在重建', respawnRemaining: '剩余 {{count}} Tick', respawnProgress: 'Core 重建进度', respawnReady: '正在等待下一次状态部署……', respawnHint: '你的单位和资源已经损失。系统将自动部署一个新 Core 和工人。',
      produceUnit: '生产单位', resourcesAvailable: '当前资源 {{count}}', unitCost: '{{cost}} 资源',
      emptyPlan: '没有手动覆盖，Agent 指令继续生效。', connected: '实时', disconnected: '已断开',
      actions: { MOVE: '移动', HARVEST: '采集', DEPOSIT: '交付', SWEEP: '横扫', SHOOT: '射击', PICKUP_BEACON: '拾取信标', DROP_BEACON: '放下信标', WAIT: '原地待命', SPAWN: '生产', REPAIR_SHIELD: '修复护盾', START_MOVE: '迁移 Core', CANCEL_MOVE: '取消迁移' },
      units: { WORKER: '工人', VANGUARD: '先锋', RANGER: '游侠', CORE: 'Core' },
    },
    stats: { title: '操作员统计', subtitle: '仅自己可见的生涯记录', damageDealt: '造成伤害', damageReceived: '承受伤害', unitsDestroyed: '单位摧毁参与', coresDestroyed: 'Core 摧毁参与', harvested: '采集资源', deposited: '交付资源', beaconPickups: '信标拾取次数', beaconTicksHeld: '持有信标 Tick', beaconBonusHarvested: '信标额外采集', spawned: '生产单位', lost: '损失单位', survival: 'Core 存活 Tick', respawns: '重生次数' },
    keys: { title: 'API 密钥', subtitle: '将你的本地 Agent 接入战场。', create: '创建密钥', createTitle: '创建新的 API 密钥', createDescription: '为 Agent 或本地集成创建凭据。创建后，完整密钥只会显示一次。', createConfirm: '创建 API 密钥', creating: '正在创建……', createdTitle: 'API 密钥已创建', empty: '还没有 API 密钥。', emptyHelp: '准备连接 Agent 时再创建一个即可。', copy: '复制密钥', copied: '已复制', copySuccess: '已复制到剪贴板。', copyFailed: '复制失败，请手动选择并复制密钥。', delete: '删除密钥', deleting: '正在删除……', deleteTitle: '删除这个 API 密钥？', deleteDescription: '正在使用 {{key}} 的程序会立即失去访问权限，此操作无法撤销。', deleted: 'API 密钥已删除。', created: '创建时间', lastUsed: '最近使用', never: '从未', oneTime: '请立即复制。此密钥之后不会再次显示。', close: '我已保存' },
    common: { loading: '加载中…', retry: '重试', cancel: '取消', close: '关闭', error: '出现错误', demo: '进入演示战场', language: '语言', account: '账号' },
  } },
} as const

const savedLanguage = localStorage.getItem('arena-hero.language')
const language = savedLanguage === 'zh' || savedLanguage === 'en' ? savedLanguage : navigator.language.startsWith('zh') ? 'zh' : 'en'

void i18n.use(initReactI18next).init({ resources, lng: language, fallbackLng: 'en', interpolation: { escapeValue: false } })
i18n.on('languageChanged', (next) => {
  localStorage.setItem('arena-hero.language', next)
  document.documentElement.lang = next
})

export default i18n
