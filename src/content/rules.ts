export type RuleCard = {
  name: string
  stats: string[]
  actions?: string
  description: string
}

export type RuleSection = {
  id: string
  number: string
  title: string
  summary: string
  bullets: string[]
  callout?: { label: string; text: string }
  cards?: RuleCard[]
}

export type RulesContent = {
  authorityLabel: string
  authority: string
  sections: RuleSection[]
}

const en: RulesContent = {
  authorityLabel: 'The short version',
  authority: 'These are the rules you need to play. Rare conflicts and recovery cases are resolved deterministically by the server.',
  sections: [
    {
      id: 'world', number: '01', title: 'What you are doing',
      summary: 'Grow from one Core, build an army, and attack other players in one permanent shared world.',
      bullets: [
        'There are no matches, seasons, NPCs, or final winner. The world keeps running.',
        'Resource cells fund your Core. Obstacles block movement, vision, and Ranger shots.',
        'Fog of war hides anything outside the combined vision of your Core and Units.',
      ],
      callout: { label: 'CORE LOOP', text: 'Explore → harvest → deposit → produce → fight → repeat' },
    },
    {
      id: 'ticks', number: '02', title: 'When to act',
      summary: 'The game advances in Ticks. You receive one complete visible state for each Tick.',
      bullets: [
        'tick means a new Tick started, but commands are still closed. state is your cue to act.',
        'Everyone gets the same 15-second command window. received confirms that your latest plan was saved.',
        'After submitting, wait for the next tick. You may replace the plan while the window is still open.',
      ],
      callout: { label: 'FLOW', text: 'tick → state → submit → received → wait for the next tick' },
    },
    {
      id: 'units', number: '03', title: 'Your pieces',
      summary: 'Each object can perform at most one active action per Tick. Doing nothing means WAIT.',
      bullets: [
        'A new Unit is produced on the Core cell and begins acting next Tick.',
        'Movement and attacking are mutually exclusive in the same Tick.',
      ],
      cards: [
        { name: 'Core', stats: ['HP 20', 'SHIELD 20', 'VISION 5'], actions: 'SPAWN · REPAIR · MIGRATE', description: 'Stores resources. Worker costs 5, Vanguard 10, Ranger 12. Migration takes 4 Ticks.' },
        { name: 'Worker', stats: ['HP 2', 'VISION 3', 'CARGO 1', 'COST 5'], actions: 'MOVE · HARVEST · DEPOSIT', description: 'Collects one resource and carries it back to the Core.' },
        { name: 'Vanguard', stats: ['HP 4', 'VISION 4', 'DAMAGE 1', 'COST 10'], actions: 'MOVE · SWEEP', description: 'Hits every enemy in one adjacent orthogonal cell.' },
        { name: 'Ranger', stats: ['HP 2', 'VISION 5', 'RANGE 1–3', 'COST 12'], actions: 'MOVE · SHOOT', description: 'Shoots one target in a straight line, including an adjacent target. Anything in between blocks the shot.' },
      ],
    },
    {
      id: 'movement', number: '04', title: 'Movement and cell capacity',
      summary: 'Units move one orthogonal cell per Tick.',
      bullets: [
        'A cell holds at most 2 occupying entities. Core, Worker, Vanguard, and Ranger all count.',
        'Different players can never share a cell. If they contest one destination, every contender fails.',
        'The server resolves movement chains simultaneously, so successful departures free space during the same Tick.',
      ],
      callout: { label: 'HARD LIMIT', text: 'At most 2 occupying entities per cell, including the Core.' },
    },
    {
      id: 'resources', number: '05', title: 'Resources and upkeep',
      summary: 'Workers gather the only resource; the Core spends it on Units, shield repair, and upkeep.',
      bullets: [
        'HARVEST on a resource cell, then DEPOSIT while sharing a cell with your available Core.',
        'Upkeep is charged at the start of each Tick: tier = floor(Unit count / 20), cost = tier × (tier + 1) / 2.',
        'If resources run short, every missing point deals 1 damage to the Core, shield first.',
      ],
    },
    {
      id: 'combat', number: '06', title: 'Combat, destruction, and control',
      summary: 'All attacks are checked from one snapshot and all damage lands simultaneously.',
      bullets: [
        'A Unit killed this Tick still completes its locked attack. Mutual destruction is possible.',
        'When a Core dies, its inventory and all Units disappear. It respawns after 20 Ticks with 20 resources and one Worker.',
        'The victim privately sees the usernames of every player who damaged the destroyed Core that Tick; there is no fabricated last hit.',
        'Manual explicit actions override Agent actions for the same object. Objects omitted by Manual fall back to the Agent; otherwise they WAIT.',
      ],
    },
  ],
}

const zh: RulesContent = {
  authorityLabel: '极简版',
  authority: '下面就是开始游戏所需的全部规则。少见的冲突与恢复边界由服务端确定性处理。',
  sections: [
    {
      id: 'world', number: '01', title: '你要做什么',
      summary: '从一个 Core 开始发展经济、生产军队，并在同一个永久世界中攻击其他玩家。',
      bullets: [
        '没有对局、赛季、NPC 或最终胜利者，世界会一直运行。',
        '资源格为 Core 提供资源；障碍会挡住移动、视野和 Ranger 射击。',
        '战争迷雾会隐藏 Core 与 Unit 合并视野之外的一切。',
      ],
      callout: { label: '核心循环', text: '探索 → 采集 → 交付 → 生产 → 战斗 → 重复' },
    },
    {
      id: 'ticks', number: '02', title: '什么时候行动',
      summary: '游戏按 Tick 前进，每个 Tick 你都会收到一份完整的当前可见状态。',
      bullets: [
        'tick 只表示新 Tick 开始，指令仍关闭；state 才是行动信号。',
        '所有玩家共享相同的 15 秒窗口；received 表示最新计划已经保存。',
        '提交后等待下一个 tick。窗口关闭前可以用新计划替换旧计划。',
      ],
      callout: { label: '流程', text: 'tick → state → 提交 → received → 等待下一个 tick' },
    },
    {
      id: 'units', number: '03', title: '你控制的对象',
      summary: '每个对象每 Tick 最多执行一个主动动作；什么都不做就是 WAIT。',
      bullets: [
        '新 Unit 出现在 Core 格，从下一个 Tick 开始行动。',
        '同一个 Tick 内，移动与攻击互斥。',
      ],
      cards: [
        { name: 'Core', stats: ['HP 20', '护盾 20', '视野 5'], actions: '生产 · 修盾 · 迁移', description: '保存资源。Worker 5、Vanguard 10、Ranger 12；迁移一格需要 4 Tick。' },
        { name: 'Worker', stats: ['HP 2', '视野 3', '携带 1', '价格 5'], actions: '移动 · 采集 · 交付', description: '采集一份资源并运回 Core。' },
        { name: 'Vanguard', stats: ['HP 4', '视野 4', '伤害 1', '价格 10'], actions: '移动 · 横扫', description: '攻击一个相邻格中的全部敌人。' },
        { name: 'Ranger', stats: ['HP 2', '视野 5', '射程 1–3', '价格 12'], actions: '移动 · 射击', description: '直线射击一个目标，包括相邻目标；中间的任何对象都会挡住箭矢。' },
      ],
    },
    {
      id: 'movement', number: '04', title: '移动与格子容量',
      summary: 'Unit 每 Tick 最多上下左右移动一格。',
      bullets: [
        '每格最多容纳 2 个可占位实体，Core 和所有 Unit 都计入。',
        '不同玩家永远不能同格；争夺同一目标格时，所有争夺者全部失败。',
        '全服移动同时结算，成功离开的 Unit 会在同一 Tick 释放位置。',
      ],
      callout: { label: '硬性上限', text: '每格最多 2 个可占位实体，包含 Core。' },
    },
    {
      id: 'resources', number: '05', title: '资源与维护费',
      summary: 'Worker 采集唯一资源；Core 用它生产、修盾并支付军队维护费。',
      bullets: [
        '在资源格执行 HARVEST；与可接收资源的 Core 同格时执行 DEPOSIT。',
        '每 Tick 开始扣维护费：tier = floor(Unit 数 / 20)，费用 = tier × (tier + 1) / 2。',
        '资源不足时，每缺 1 点就对 Core 造成 1 点伤害，先扣护盾。',
      ],
    },
    {
      id: 'combat', number: '06', title: '战斗、摧毁与控制',
      summary: '全部攻击基于同一个快照校验，全部伤害同时生效。',
      bullets: [
        '本 Tick 被杀的 Unit 仍会完成已锁定攻击，因此可以同归于尽。',
        'Core 被摧毁后，库存和全部 Unit 消失；20 Tick 后带 20 资源和一个 Worker 重生。',
        '受害者会私下看到本 Tick 参与摧毁 Core 的全部玩家 username；系统不会虚构最后一击。',
        'Manual 明确动作覆盖同一对象的 Agent 动作；Manual 未列出的对象回退 Agent，否则 WAIT。',
      ],
    },
  ],
}

export const rulesContent = { en, zh } as const
