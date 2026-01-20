import { Context, h, Schema } from 'koishi'

export const name = 'onebot-customize-card'

export interface CardConfig {
  commandName: string
  title: string
  url: string
  audio: string
  image: string
  enabled: boolean
  sendExtraText?: boolean
  enableExtraTextQuote: boolean
  extraTextMessage?: string
}

export interface Config {
  cards: CardConfig[]
}

export const Config: Schema<Config> = Schema.object({
  cards: Schema.array(Schema.object({
    commandName: Schema.string().required().description('⌨️ 指令名称'),
    title: Schema.string().required().description('📝 标题'),
    url: Schema.string().role('link').description('🔗 跳转链接').default('https://www.baidu.com'),
    audio: Schema.string().role('link').description('🎵 音频链接'),
    image: Schema.string().role('link').description('🖼️ 封面图片链接'),
    enabled: Schema.boolean().default(true).description('✅ 是否启用'),
    sendExtraText: Schema.boolean().default(true).description('💬 是否发送额外文字消息'),
    enableExtraTextQuote: Schema.boolean().default(true).description('🧷 额外文字消息是否触发指令的消息'),
    extraTextMessage: Schema.string()
      .default('也可以复制到浏览器打开：http://ledao3.vincentzyu233.cn:58211/recharge')
      .description('✍️ 文字消息内容'),
  })).default([{
    commandName: '余额充值',
    title: 'kelebot余额充值(打不开就复制跳转浏览器)',
    url: 'http://ledao3.vincentzyu233.cn:58211/recharge',
    audio: 'http://ledao3.vincentzyu233.cn:58211/recharge',
    image: 'https://q1.qlogo.cn/g?b=qq&nk=2718246545&s=640',
    enabled: true,
    sendExtraText: true,
    enableExtraTextQuote: true,
    extraTextMessage: '也可以复制到浏览器打开：http://ledao3.vincentzyu233.cn:58211/recharge',
  }]).description('🗂️ 自定义卡片列表'),
}).description('⚙️ 基础配置')

export function apply(ctx: Context, config: Config) {
  const { cards = [] } = config
  for (const card of cards) {
    if (!card.enabled || !card.commandName) continue

    ctx.command(card.commandName, `发送自定义音乐卡片: ${card.title}`)
      .action(async ({ session }) => {
        const onebotBot = ctx.bots.find(b => b.platform === 'onebot') as any
        if (!onebotBot) {
          return '未找到 OneBot 适配器'
        }

        const msgArr = [{
          type: 'music',
          data: {
            type: 'custom',
            url: card.url,
            audio: card.audio,
            title: card.title,
            image: card.image,
          }
        }]

        try {
          if (session.isDirect) {
            await onebotBot.internal._request('send_private_msg', {
              user_id: parseInt(session.userId),
              message: msgArr,
            })
          } else {
            await onebotBot.internal._request('send_group_msg', {
              group_id: parseInt(session.channelId),
              message: msgArr,
            })
          }
          if (card.sendExtraText && card.extraTextMessage?.trim()) {
            await session.send(`${card.enableExtraTextQuote ? h.quote(session.messageId) : ''}${card.extraTextMessage}`)
          }
          ctx.logger.info(`发送成功: ${card.title} (${card.commandName})`)
        } catch (e) {
          ctx.logger.error(`发送失败:`, e)
          return `发送失败: ${e.message}`
        }
      })
  }
}
