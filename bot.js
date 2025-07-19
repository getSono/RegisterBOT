const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Lädt Umgebungsvariablen aus .env Datei

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const messages = []; // In-Memory Nachrichtenspeicher (nur temporär!)

bot.once('ready', () => {
  console.log(`✅ Bot ist online als ${bot.user.tag}`);
});

// Reagiere auf DMs mit ✅ und speichere sie
bot.on('messageCreate', async message => {
  if (message.channel.type === 1 && !message.author.bot) {
    try {
      await message.react('✅');
      messages.push({
        id: message.id,
        userId: message.author.id,
        username: message.author.tag,
        avatar: message.author.displayAvatarURL(),
        content: message.content,
        timestamp: message.createdTimestamp
      });
    } catch (err) {
      console.error('Fehler bei DM:', err);
    }
  }
});

// Liste aller Server
app.get('/guilds', (req, res) => {
  const guilds = bot.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    iconUrl: guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
      : null
  }));
  res.json(guilds);
});

// Liste aller Mitglieder
app.get('/members/:guildId', async (req, res) => {
  const guild = bot.guilds.cache.get(req.params.guildId);
  if (!guild) return res.status(404).json({ error: 'Guild not found' });

  await guild.members.fetch();
  const members = guild.members.cache.map(member => {
    const user = member.user;
    return {
      id: user.id,
      username: user.tag,
      avatarUrl: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`
    };
  });

  res.json(members);
});

// Nachricht senden
app.post('/message', async (req, res) => {
  const { userId, message } = req.body;
  try {
    const user = await bot.users.fetch(userId);
    await user.send(message);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nachricht konnte nicht gesendet werden.' });
  }
});

// DMs abrufen
app.get('/messages', (req, res) => {
  res.json(messages);
});

bot.login(process.env.BOT_TOKEN); // <-- Ersetze durch deinen Bot-Token
app.listen(PORT, () => {
  console.log(`🌐 Webserver läuft auf http://localhost:${PORT}`);
});

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
