require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');
const { inlineKeyboard } = require('telegraf/markup');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

async function getWordDefinition(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = response.data[0];

    const meanings = data.meanings.map(meaning => {
      return {
        partOfSpeech: meaning.partOfSpeech,
        definition: meaning.definitions[0].definition,
        synonyms: meaning.synonyms || [],
        antonyms: meaning.antonyms || []
      };
    });

    return {
      word: data.word,
      meanings: meanings,
    };
  } catch (error) {
    return null;
  }
}

bot.start((ctx) => {
  const userName = ctx.from.first_name;
  const greetingMessage = `👋 Hi ${userName}, welcome to the Dictionary Bot! Here are the available commands:\n\n` +
                          `/start - Show this menu\n` +
                          `/source - Get the source code\n\n` +
                          `How to use me? Well, just type any recognized English word and get all the available details of it`;
  ctx.reply(greetingMessage);
});

bot.command('source', (ctx) => {
  const inlineKeyboard = [
    [
      {
        text: 'Give it a star ⭐',
        url: 'https://github.com/IlyosovSarvarbek/eng_dictionary_bot'
      }
    ]
  ];

  ctx.replyWithHTML('📌 Check out the source code on GitHub:\n\n' +
            '🔗 <a href="https://github.com/IlyosovSarvarbek/eng_dictionary_bot">GitHub repository</a>\n\n' +
            '⭐ Don\'t forget to give it a star!',
    {
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    }
  );
});


bot.on('text', async (ctx) => {
  const userInput = ctx.message.text.trim();
  
  if (userInput) {
    const wordData = await getWordDefinition(userInput);
    
    if (wordData) {
      let replyMessage = `📖 Definitions for "${wordData.word}":\n\n`;
      
      wordData.meanings.forEach((meaning, index) => {
        replyMessage += `${index + 1}. (${meaning.partOfSpeech}) ${meaning.definition}\n`;
        
        if (meaning.synonyms.length > 0) {
          replyMessage += `   🔹 Synonyms: ${meaning.synonyms.join(', ')}\n`;
        }
        
        if (meaning.antonyms.length > 0) {
          replyMessage += `   🔻 Antonyms: ${meaning.antonyms.join(', ')}\n`;
        }

        replyMessage += '\n';
      });

      ctx.reply(replyMessage);
    } else {
      ctx.reply('❌ Sorry, I couldn\'t find a definition for that word.');
    }
  }
});

bot.telegram.setMyCommands([
  { command: 'start', description: 'Show available commands' },
  { command: 'source', description: 'Get the source code' }
]);

bot.launch().then(() => {
  console.log('📚 Dictionary bot is online!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
