import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    brand: 'ARENA HERO', tagline: 'Persistent world. Precise orders.',
    nav: { arena: 'Arena', docs: 'Documentation', stats: 'Statistics', keys: 'API Keys' },
    auth: {
      welcome: 'Return to the arena', create: 'Create your operator', email: 'Email', username: 'Username', password: 'Password', confirmPassword: 'Confirm password', passwordMismatch: 'The two passwords do not match.',
      login: 'Sign in', register: 'Create account', noAccount: 'No account yet?', hasAccount: 'Already registered?',
      forgot: 'Forgot password?', github: 'Continue with GitHub', verificationSent: 'Verification link sent. Check your inbox.',
      verifyTitle: 'Verify your signal', verifying: 'Verifying email…', verified: 'Email verified. Your Core will activate on a deterministic tick boundary.',
      resetTitle: 'Reset access', sendReset: 'Send reset link', reset: 'Set new password', back: 'Back to sign in', logout: 'Sign out', resend: 'Resend verification', linkGithub: 'Link GitHub',
      githubLinkTitle: 'Connect your GitHub identity', githubLinkDescription: 'Authorize GitHub in a separate secure window. Your arena view stays open while the account is linked.', githubLinkAction: 'Continue to GitHub', githubLinkOpened: 'Complete authorization in the GitHub window.', githubLinkSuccess: 'GitHub account linked.', popupBlocked: 'The authorization window was blocked. Allow pop-ups and try again.',
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
      agent: 'Agent', manual: 'Manual', lastReceived: 'Last received', clear: 'Clear order', targetHint: 'Choose a highlighted shootable unit',
      moveHint: 'Choose a highlighted destination cell', moveTo: 'Move to {{x}}, {{y}}', sweepHint: 'Choose an adjacent hostile unit to sweep',
      commandWindow: 'Command window', secondsRemaining: 'seconds remaining',
      produceUnit: 'Produce unit', resourcesAvailable: '{{count}} available', unitCost: '{{cost}} resources',
      emptyPlan: 'No manual overrides. Agent orders remain active.', connected: 'Live', disconnected: 'Disconnected',
      actions: { MOVE: 'Move', HARVEST: 'Harvest', DEPOSIT: 'Deposit', SWEEP: 'Sweep', SHOOT: 'Shoot', WAIT: 'Hold', SPAWN: 'Spawn', REPAIR_SHIELD: 'Repair shield', START_MOVE: 'Move Core', CANCEL_MOVE: 'Cancel migration' },
      units: { WORKER: 'Worker', VANGUARD: 'Vanguard', RANGER: 'Ranger', CORE: 'Core' },
    },
    stats: { title: 'Operator statistics', subtitle: 'Private lifetime record', damageDealt: 'Damage dealt', damageReceived: 'Damage received', unitsDestroyed: 'Unit assists', coresDestroyed: 'Core assists', harvested: 'Harvested', deposited: 'Deposited', spawned: 'Units spawned', lost: 'Units lost', survival: 'Core survival ticks', respawns: 'Respawns' },
    keys: { title: 'API keys', subtitle: 'Connect a local agent to the arena.', create: 'Create key', createTitle: 'Create a new API key', createDescription: 'Create a credential for an Agent or local integration. The full key will be shown once after creation.', createConfirm: 'Create API key', creating: 'Creating…', createdTitle: 'API key created', empty: 'No API keys yet.', emptyHelp: 'Create one when you are ready to connect an Agent.', copy: 'Copy key', copied: 'Copied', copySuccess: 'Copied to clipboard.', copyFailed: 'Could not copy. Select and copy the key manually.', delete: 'Delete key', deleting: 'Deleting…', deleteTitle: 'Delete this API key?', deleteDescription: 'Anything using {{key}} will immediately lose access. This cannot be undone.', deleted: 'API key deleted.', created: 'Created', lastUsed: 'Last used', never: 'Never', oneTime: 'Copy this key now. It will never be shown again.', close: 'I saved it' },
    common: { loading: 'Loading…', retry: 'Retry', cancel: 'Cancel', close: 'Close', error: 'Something went wrong', demo: 'Open demo arena', language: 'Language', account: 'Account' },
  } },
  zh: { translation: {
    brand: 'ARENA HERO', tagline: '永久世界，精确指令。',
    nav: { arena: '战场', docs: '文档', stats: '统计', keys: 'API 密钥' },
    auth: {
      welcome: '重返战场', create: '创建操作员', email: '邮箱', username: '用户名', password: '密码', confirmPassword: '再次输入密码', passwordMismatch: '两次输入的密码不一致。',
      login: '登录', register: '创建账号', noAccount: '还没有账号？', hasAccount: '已经注册？',
      forgot: '忘记密码？', github: '使用 GitHub 继续', verificationSent: '验证链接已发送，请检查邮箱。',
      verifyTitle: '验证信号', verifying: '正在验证邮箱…', verified: '邮箱验证成功。你的 Core 会在确定性的 Tick 边界激活。',
      resetTitle: '重置访问权限', sendReset: '发送重置链接', reset: '设置新密码', back: '返回登录', logout: '退出登录', resend: '重新发送验证邮件', linkGithub: '关联 GitHub',
      githubLinkTitle: '关联你的 GitHub 身份', githubLinkDescription: '在独立的安全窗口中完成 GitHub 授权，战场画面会保持打开。', githubLinkAction: '前往 GitHub 授权', githubLinkOpened: '请在 GitHub 窗口中完成授权。', githubLinkSuccess: 'GitHub 账号已关联。', popupBlocked: '授权窗口被浏览器拦截，请允许弹出窗口后重试。',
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
      agent: 'Agent', manual: '手动', lastReceived: '最近接收', clear: '清除指令', targetHint: '选择一个高亮的可射击敌方单位',
      moveHint: '选择一个高亮的可移动格子', moveTo: '移动到 {{x}}, {{y}}', sweepHint: '选择相邻的敌方单位进行横扫',
      commandWindow: '指令窗口', secondsRemaining: '秒剩余',
      produceUnit: '生产单位', resourcesAvailable: '当前资源 {{count}}', unitCost: '{{cost}} 资源',
      emptyPlan: '没有手动覆盖，Agent 指令继续生效。', connected: '实时', disconnected: '已断开',
      actions: { MOVE: '移动', HARVEST: '采集', DEPOSIT: '交付', SWEEP: '横扫', SHOOT: '射击', WAIT: '原地待命', SPAWN: '生产', REPAIR_SHIELD: '修复护盾', START_MOVE: '迁移 Core', CANCEL_MOVE: '取消迁移' },
      units: { WORKER: '工人', VANGUARD: '先锋', RANGER: '游侠', CORE: 'Core' },
    },
    stats: { title: '操作员统计', subtitle: '仅自己可见的生涯记录', damageDealt: '造成伤害', damageReceived: '承受伤害', unitsDestroyed: '单位摧毁参与', coresDestroyed: 'Core 摧毁参与', harvested: '采集资源', deposited: '交付资源', spawned: '生产单位', lost: '损失单位', survival: 'Core 存活 Tick', respawns: '重生次数' },
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
