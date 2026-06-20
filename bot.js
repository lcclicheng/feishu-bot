// Telegram AI Bot - 部署到 Railway
// Node.js + Telegraf (比 Python 更轻量)

const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DS_KEY = process.env.DEEPSEEK_KEY;

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('👋 你好！我是AI助手，有什么可以帮你的？');
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  console.log(`收到: ${text.slice(0, 50)}`);
  
  try {
    // 回复"思考中"
    await ctx.reply('🤔 思考中...');
    
    // 调用 DeepSeek
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DS_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是AI助手，回答问题简洁有用。' },
          { role: 'user', content: text }
        ],
        max_tokens: 2000
      })
    });
    
    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || '抱歉，我没有理解你的问题。';
    await ctx.reply(reply);
    console.log(`回复: ${reply.slice(0, 50)}...`);
    
  } catch (e) {
    console.error('错误:', e.message);
    ctx.reply(`抱歉，出错了: ${e.message}`);
  }
});

// Railway health check
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Telegram AI Bot ✅'));
app.get('/webhook', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;

// 启动 bot (long polling模式, 不需要webhook)
bot.launch().then(() => {
  console.log('Bot 已启动 ✅');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
