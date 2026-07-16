import type { RulesContent } from './rules'

export type DocTable = {
  headers: string[]
  rows: string[][]
}

export type DocCodeBlock = {
  label: string
  language: string
  code: string
}

export type ApiDocSection = {
  id: string
  title: string
  summary: string
  paragraphs?: string[]
  bullets?: string[]
  table?: DocTable
  codeBlocks?: DocCodeBlock[]
}

export type ApiDocsContent = {
  title: string
  subtitle: string
  sections: ApiDocSection[]
}

export type DocsUiContent = {
  eyebrow: string
  title: string
  subtitle: string
  back: string
  contents: string
  part: string
  rulesTitle: string
  rulesSubtitle: string
  apiTitle: string
  copyRules: string
  copyApi: string
  copying: string
  copied: string
  copyFailed: string
  unitTable: [string, string, string, string]
}

const enUi: DocsUiContent = {
  eyebrow: 'ARENA HERO · V0.1',
  title: 'Documentation',
  subtitle: 'The complete game rules and the HTTP API contract in one place.',
  back: 'Back to arena',
  contents: 'Contents',
  part: 'PART',
  rulesTitle: 'Game rules',
  rulesSubtitle: 'Everything you need to start playing, in about one minute.',
  apiTitle: 'API reference',
  copyRules: 'Copy game rules as Markdown',
  copyApi: 'Copy API as Markdown',
  copying: 'Copying…',
  copied: 'Markdown copied',
  copyFailed: 'Could not copy Markdown',
  unitTable: ['Object', 'Stats', 'Actions', 'Description'],
}

const zhUi: DocsUiContent = {
  eyebrow: 'ARENA HERO · V0.1',
  title: '文档',
  subtitle: '在同一处查看完整游戏规则与 HTTP API 协议。',
  back: '返回战场',
  contents: '目录',
  part: '部分',
  rulesTitle: '游戏规则',
  rulesSubtitle: '一分钟读完，足够直接开始玩。',
  apiTitle: 'API 文档',
  copyRules: '复制游戏规则 Markdown',
  copyApi: '复制 API Markdown',
  copying: '正在复制…',
  copied: 'Markdown 已复制',
  copyFailed: '无法复制 Markdown',
  unitTable: ['对象', '属性', '动作', '说明'],
}

const enApi: ApiDocsContent = {
  title: 'API reference',
  subtitle: 'HTTP endpoints for local Agents. All timestamps are UTC RFC3339Nano and all coordinates are [x, y].',
  sections: [
    {
      id: 'api-conventions',
      title: 'Authentication and conventions',
      summary: 'Agent requests authenticate with an API key.',
      bullets: [
        'Agent: Authorization: Bearer <api-key>. API keys use the ah_live_<random> format and are shown only once when created.',
        'JSON errors contain a stable error code in the error field.',
        'A player that is not ready yet cannot connect to the game stream and receives 409 PLAYER_NOT_READY.',
      ],
      codeBlocks: [{
        label: 'Agent request headers', language: 'http',
        code: 'Authorization: Bearer ah_live_…\nContent-Type: application/json',
      }],
    },
    {
      id: 'api-stream',
      title: 'GET /api/v1/game/stream',
      summary: 'The Server-Sent Events stream is the authoritative game loop. It has three event types and a comment heartbeat.',
      bullets: [
        'tick announces that a new logical Tick has begun. Commands are still closed.',
        'state contains the complete PlayerStateView and is the only cue to send commands. Requests may wait until every player has received state and the shared 15-second window opens.',
        'PlayerStateView includes status. While status is RESPAWNING, respawn_at_tick identifies the deterministic redeployment Tick.',
        'CORE_DESTROYED is private to the victim. For attack destruction, values.destroyed_by lists every attacker username from that Tick; ordinary enemy objects still expose no owner identity.',
        'received confirms each newly persisted plan. Replacing a plan emits another received event.',
        'A : heartbeat comment may be sent every 15 seconds. There are no event IDs, event history, or Last-Event-ID replay.',
        'During reconnect, the server restores the current authoritative Tick phase; reconnecting never extends the command window.',
      ],
      codeBlocks: [{
        label: 'SSE sequence', language: 'text',
        code: 'event: tick\ndata: 10583\n\nevent: state\ndata: {"status":"ACTIVE","resources":42,"population":4,"population_tier":0,"upkeep_next_tick":0,"objects":[],"events":[]}\n\nevent: received\ndata: {"tick":10583,"source":"AGENT","received_at":"2026-07-15T12:00:06.241Z"}\n\n: heartbeat',
      }],
    },
    {
      id: 'api-commands',
      title: 'POST /api/v1/game/commands',
      summary: 'Submit one complete Agent plan for the current Tick.',
      bullets: [
        'Idempotency-Key is required and must contain 8–128 characters. The same key and body returns the original response; the same key with a different body returns IDEMPOTENCY_CONFLICT.',
        'The server reads and parses the complete, size-limited body before command-window admission. Slow headers or bodies cannot hold a Tick open.',
        'The latest complete accepted plan for each (player, tick, source) wins. A POST replaces the previous source plan; plans are not merged.',
        'HTTP 202 means the plan was durably accepted, not that its dynamic actions will succeed during resolution.',
        'Common errors: COMMAND_SUPERSEDED, COMMAND_WINDOW_CLOSED, TICK_NOT_READY, TICK_MISMATCH, INVALID_COMMAND, IDEMPOTENCY_CONFLICT, UNAUTHORIZED.',
        'Dynamic failures appear in the next state.events. A cell holds at most 2 occupying entities including Core; capacity failures use CELL_UNIT_LIMIT. Ranger dynamic shot failures use the non-revealing SHOT_MISSED code.',
      ],
      codeBlocks: [
        {
          label: 'Request', language: 'http',
          code: 'POST /api/v1/game/commands\nAuthorization: Bearer <api-key>\nIdempotency-Key: 01J2Q5FQ9J4CW8KJQ5M3P0T7VX\nContent-Type: application/json\n\n{\n  "tick": 10583,\n  "unit_actions": {\n    "9d3e4941-2816-4a39-a220-df8cd95e877d": {\n      "type": "SHOOT",\n      "target_id": "175f47f4-f7de-4785-b45c-9a2d2289a8ea",\n      "expected_cell": [120, 85]\n    }\n  },\n  "core_action": { "type": "SPAWN", "unit_type": "VANGUARD" }\n}',
        },
        {
          label: '202 Accepted', language: 'json',
          code: '{\n  "accepted": true,\n  "tick": 10583,\n  "source": "AGENT",\n  "received_at": "2026-07-15T12:00:06.241Z"\n}',
        },
      ],
    },
  ],
}

const zhApi: ApiDocsContent = {
  title: 'API 文档',
  subtitle: '本地 Agent 使用的 HTTP 接口。所有时间为 UTC RFC3339Nano，所有坐标为 [x, y]。',
  sections: [
    {
      id: 'api-conventions',
      title: '认证与通用约定',
      summary: 'Agent 请求使用 API Key 认证。',
      bullets: [
        'Agent：Authorization: Bearer <api-key>。API Key 格式为 ah_live_<random>，明文只在创建时显示一次。',
        'JSON 错误响应会在 error 字段返回稳定错误码。',
        '玩家尚未就绪时无法连接游戏流，返回 409 PLAYER_NOT_READY。',
      ],
      codeBlocks: [{
        label: 'Agent 请求头', language: 'http',
        code: 'Authorization: Bearer ah_live_…\nContent-Type: application/json',
      }],
    },
    {
      id: 'api-stream',
      title: 'GET /api/v1/game/stream',
      summary: 'Server-Sent Events 游戏流是权威游戏循环，只包含三种事件和注释心跳。',
      bullets: [
        'tick 宣布新的逻辑 Tick 已开始，但此时指令仍然关闭。',
        'state 包含完整 PlayerStateView，是唯一行动触发器。请求可以等待，直到所有玩家收到 state 后统一开放 15 秒窗口。',
        'PlayerStateView 包含 status。重生期间 status 为 RESPAWNING，respawn_at_tick 标记确定的重新部署 Tick。',
        'CORE_DESTROYED 仅对受害者可见。攻击摧毁时，values.destroyed_by 会列出本 Tick 的全部攻击者 username；普通敌方对象仍不暴露 owner 身份。',
        'received 确认一份新计划已经持久化。每次成功替换计划都会再次发送 received。',
        '服务端可以每 15 秒发送 : heartbeat 注释。SSE 没有事件 ID、历史或 Last-Event-ID 重放。',
        '重连会恢复当前权威 Tick 阶段；重连永远不会延长指令窗口。',
      ],
      codeBlocks: [{
        label: 'SSE 顺序', language: 'text',
        code: 'event: tick\ndata: 10583\n\nevent: state\ndata: {"status":"ACTIVE","resources":42,"population":4,"population_tier":0,"upkeep_next_tick":0,"objects":[],"events":[]}\n\nevent: received\ndata: {"tick":10583,"source":"AGENT","received_at":"2026-07-15T12:00:06.241Z"}\n\n: heartbeat',
      }],
    },
    {
      id: 'api-commands',
      title: 'POST /api/v1/game/commands',
      summary: '提交当前 Tick 的一份完整 Agent 计划。',
      bullets: [
        '必须发送 8–128 字符的 Idempotency-Key。相同 key 和 body 返回原响应；相同 key 配不同 body 返回 IDEMPOTENCY_CONFLICT。',
        '服务端读完并解析完整、受大小限制的 body 后才进入命令窗口门控。慢速 headers 或 body 无法拖住 Tick。',
        '每个 (player, tick, source) 最后被接受的完整计划获胜。POST 会完整替换同来源旧计划，不会合并。',
        'HTTP 202 只表示计划已持久化，不代表其中的动态行动一定会在结算时成功。',
        '常见错误：COMMAND_SUPERSEDED、COMMAND_WINDOW_CLOSED、TICK_NOT_READY、TICK_MISMATCH、INVALID_COMMAND、IDEMPOTENCY_CONFLICT、UNAUTHORIZED。',
        '动态失败通过下一次 state.events 返回。每格最多 2 个可占位实体，Core 也计入；格子容量失败使用 CELL_UNIT_LIMIT。Ranger 动态射击失败统一使用不泄密的 SHOT_MISSED。',
      ],
      codeBlocks: [
        {
          label: '请求', language: 'http',
          code: 'POST /api/v1/game/commands\nAuthorization: Bearer <api-key>\nIdempotency-Key: 01J2Q5FQ9J4CW8KJQ5M3P0T7VX\nContent-Type: application/json\n\n{\n  "tick": 10583,\n  "unit_actions": {\n    "9d3e4941-2816-4a39-a220-df8cd95e877d": {\n      "type": "SHOOT",\n      "target_id": "175f47f4-f7de-4785-b45c-9a2d2289a8ea",\n      "expected_cell": [120, 85]\n    }\n  },\n  "core_action": { "type": "SPAWN", "unit_type": "VANGUARD" }\n}',
        },
        {
          label: '202 Accepted', language: 'json',
          code: '{\n  "accepted": true,\n  "tick": 10583,\n  "source": "AGENT",\n  "received_at": "2026-07-15T12:00:06.241Z"\n}',
        },
      ],
    },
  ],
}

export const docsUiContent = { en: enUi, zh: zhUi } as const
export const apiDocsContent = { en: enApi, zh: zhApi } as const

function markdownTable(table: DocTable) {
  const escapeCell = (value: string) => value.replaceAll('|', '\\|')
  return [
    `| ${table.headers.map(escapeCell).join(' | ')} |`,
    `| ${table.headers.map(() => '---').join(' | ')} |`,
    ...table.rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
  ].join('\n')
}

export function gameRulesMarkdown(ui: DocsUiContent, rules: RulesContent) {
  const lines = [`# Arena Hero ${ui.rulesTitle}`, '', ui.rulesSubtitle, '', `> **${rules.authorityLabel}:** ${rules.authority}`]

  for (const section of rules.sections) {
    lines.push('', `### ${section.number}. ${section.title}`, '', section.summary)
    if (section.cards) {
      lines.push('', markdownTable({
        headers: ui.unitTable,
        rows: section.cards.map((card) => [card.name, card.stats.join(' · '), card.actions ?? '—', card.description]),
      }))
    }
    lines.push('', ...section.bullets.map((bullet) => `- ${bullet}`))
    if (section.callout) lines.push('', `> **${section.callout.label}:** ${section.callout.text}`)
  }

  return `${lines.join('\n')}\n`
}

export function apiReferenceMarkdown(api: ApiDocsContent) {
  const lines = [`# Arena Hero ${api.title}`, '', api.subtitle]
  for (const section of api.sections) {
    lines.push('', `### ${section.title}`, '', section.summary)
    if (section.paragraphs) lines.push('', ...section.paragraphs)
    if (section.bullets) lines.push('', ...section.bullets.map((bullet) => `- ${bullet}`))
    if (section.table) lines.push('', markdownTable(section.table))
    for (const block of section.codeBlocks ?? []) {
      lines.push('', `#### ${block.label}`, '', `\`\`\`${block.language}`, block.code, '```')
    }
  }
  return `${lines.join('\n')}\n`
}
