require('dotenv').config(); //initializes dotenv
const Discord = require('discord.js');
const client = new Discord.Client();
const leaderboard = new Map();

client.on('ready', () => {
  console.log('Bot is online!');
});

client.on('message', async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  if (command === '!giverole') {
    if (!message.member.hasPermission('MANAGE_ROLES')) return message.reply('You don\'t have permission to manage roles!');
    const role = message.mentions.roles.first();
    const user = message.mentions.users.first();
    if (!role || !user) return message.reply('Please mention a role and a user!');
    const member = message.guild.members.cache.get(user.id);
    member.roles.add(role);
    message.reply(`Added role ${role.name} to ${user.username}!`);
  }

  if (command === '!removerole') {
    if (!message.member.hasPermission('MANAGE_ROLES')) return message.reply('You don\'t have permission to manage roles!');
    const role = message.mentions.roles.first();
    const user = message.mentions.users.first();
    if (!role || !user) return message.reply('Please mention a role and a user!');
    const member = message.guild.members.cache.get(user.id);
    member.roles.remove(role);
    message.reply(`Removed role ${role.name} from ${user.username}!`);
  }

  if (command === '!addpoints') {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Please mention a user!');
    const points = parseInt(args[0]);
    if (!points) return message.reply('Please provide a valid number of points!');
    const memberId = user.id;
    const currentPoints = leaderboard.get(memberId) || 0;
    leaderboard.set(memberId, currentPoints + points);
    message.reply(`Added ${points} points to ${user.username}!`);
  }

  if (command === '!leaderboard') {
    const sortedLeaderboard = Array.from(leaderboard.entries()).sort((a, b) => b[1] - a[1]);
    const leaderboardEmbed = new Discord.MessageEmbed()
      .setTitle('Leaderboard')
      .setDescription(sortedLeaderboard.map(([id, points]) => `<@${id}> - ${points} points`).join('\n'));
    message.channel.send(leaderboardEmbed);
  }
});

client.login(process.env.CLIENT_TOKEN); //signs the bot in with token