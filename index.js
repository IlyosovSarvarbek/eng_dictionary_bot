require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

async function getWordDefinition(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = response.data[0];
    
    // Extract meanings, synonyms, antonyms
    const meanings = data.meanings.map(meaning => {
      const definition = meaning.definitions[0].definition;
      const synonyms = meaning.synonyms || [];
      const antonyms = meaning.antonyms || [];
      
      return {
        partOfSpeech: meaning.partOfSpeech,
        definition: definition,
        synonyms: synonyms,
        antonyms: antonyms
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
  const greetingMessage = `👋 Hi ${userName}, I can help you find the definitions, synonyms, and antonyms of words! Just type any word and I will send the details for you.`;
  ctx.reply(greetingMessage);
});

bot.on('text', async (ctx) => {
  const userInput = ctx.message.text.trim();
  
  if (userInput) {
    const wordData = await getWordDefinition(userInput);
    
    if (wordData) {
      let replyMessage = `Definitions and details for "${wordData.word}":\n\n`;
      
      wordData.meanings.forEach((meaning, index) => {
        replyMessage += `${index + 1}. (${meaning.partOfSpeech}) ${meaning.definition}\n`;
        
        if (meaning.synonyms.length > 0) {
          replyMessage += `   Synonyms: ${meaning.synonyms.join(', ')}\n`;
        }
        
        if (meaning.antonyms.length > 0) {
          replyMessage += `   Antonyms: ${meaning.antonyms.join(', ')}\n`;
        }

        replyMessage += '\n';
      });

      ctx.reply(replyMessage);
    } else {
      ctx.reply('Sorry, I couldn\'t find a definition for that word.');
    }
  }
});

bot.launch().then(() => {
  console.log('📚 Dictionary bot is online!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
