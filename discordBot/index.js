require('dotenv').config(); // initializes dotenv
const Discord = require('discord.js');
const { GatewayIntentBits } = Discord;
const Sequelize = require('sequelize');
const sqlite3 = require('sqlite3').verbose();
const { Client, Intents, SlashCommandBuilder, PermissionsBitField, ActivityType } = Discord;

// Create a new Sequelize instance
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  storage: './database.sqlite',
});

// Define the Leaderboard model
const Leaderboard = sequelize.define('Leaderboard', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  points: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  },
});

sequelize.sync().then(() => {
  console.log('Database connection established');
});

// Initialize the leaderboard collection
const leaderboard = Leaderboard;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('to commands from the Battle Barge!', { type: ActivityType.Listening });
  client.application.commands.set(commands);
});

const commands = [
    new SlashCommandBuilder()
    .setName('giverole')
    .setDescription('Give a role to a user')
    .addRoleOption(option => option.setName('role').setDescription('The role to give').setRequired(true))
    .addUserOption(option => option.setName('user').setDescription('The user to give the role to').setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Remove a role from a user')
    .addRoleOption(option => option.setName('role').setDescription('The role to remove').setRequired(true))
    .addUserOption(option => option.setName('user').setDescription('The user to remove the role from').setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

  new SlashCommandBuilder()
    .setName('addpoints')
    .setDescription('Add points to a user')
    .addUserOption(option => option.setName('user').setDescription('The user to add points to').setRequired(true))
    .addIntegerOption(option => option.setName('points').setDescription('The number of points to add').setRequired(true)),

  new SlashCommandBuilder()
    .setName('removepoints')
    .setDescription('Remove points from a user')
    .addUserOption(option => option.setName('user').setDescription('The user to remove points from').setRequired(true))
    .addIntegerOption(option => option.setName('points').setDescription('The number of points to remove').setRequired(true)),

  new SlashCommandBuilder()
    .setName('howto')
    .setDescription('How to Give and Remove Points'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('shows command list'),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('pong!'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the leaderboard'),
];

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = interaction.commandName;
  const args = interaction.options;

  if (command === 'giverole') {
    try {
      const role = args.getRole('role');
      const user = args.getUser('user');
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) {
        interaction.reply('User not found!');
        return;
      }
      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        interaction.reply(`Added role ${role.name} to ${user.username}!`);
      } else {
        interaction.reply(`${user.username} already has role ${role.name}!`);
      }
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while giving the role!');
    }
  }
  
  if (command === 'removerole') {
    try {
      const role = args.getRole('role');
      const user = args.getUser('user');
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) {
        interaction.reply('User not found!');
        return;
      }
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        interaction.reply(`Removed role ${role.name} from ${user.username}!`);
      } else {
        interaction.reply(`${user.username} does not have role ${role.name}!`);
      }
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while removing the role!');
    }
  }

  if (command === 'howto') {
    interaction.reply('How to Give and Remove Points, and view the leaderboard:\nADDING POINTS:\nStep 1: Type "/addpoints" and specify the user and the amount of points.\nStep 2: Press Send, then run "/leaderboard".\nThis should display the leaderboard and allow you to see everones points.\nREMOVING POINTS:\nStep 1: Run "/removepoints" and specify the user and the amount of points.\nStep 2: Press Send, then run "/leaderboard".\nThis should display the leaderboard and allow you to see everones points.')
  }

  if (command === 'help') {
    interaction.reply('/giverole - adds role to user.\n/removerole - removes role from user.\n/addpoints - adds a specified amount of points to a specified user.\n/removepoints - removes a specified amount of points to a specified user.\n/howto - shows how to give and remove points and display the leaderboard.\n')
  }

  if (command === 'ping') {
    interaction.reply('pong');
  }

  if (command === 'addpoints') {
    try {
      const user = args.getUser('user');
      const points = args.getInteger('points');
      const memberId = user.id;
  
      // Check if points is a positive integer
      if (points <= 0) {
        interaction.reply('Points must be a positive integer!');
        return;
      }
  
      const existingEntry = await Leaderboard.findOne({ where: { userId: memberId } });
      if (existingEntry) {
        // Update existing entry with new points
        await existingEntry.update({ points: existingEntry.points + points });
      } else {
        // Create a new entry if the user ID doesn't exist
        await Leaderboard.create({ userId: memberId, points });
      }
      interaction.reply(`Added ${points} points to ${user.username}!`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while adding points!');
    }
  }

  if (command === 'leaderboard') {
    if (!interaction.guild) {
      interaction.reply('This command can only be used in a guild!');
      return;
    }
    const leaderboardEntries = await Leaderboard.findAll({
      order: [['points', 'DESC']],
    });
    const members = await Promise.all(leaderboardEntries.map(async entry => {
      const memberId = entry.userId;
      let member = interaction.guild.members.cache.get(memberId);
      if (!member) {
        try {
          member = await interaction.guild.members.fetch(memberId);
        } catch (error) {
          console.error(`Error fetching member ${memberId}: ${error}`);
          member = null;
        }
      }
      return member;
    }));
    const leaderboardEmbed = new Discord.EmbedBuilder()
      .setTitle('Leaderboard')
      .setDescription(
        members.filter(member => member !== null).map(member => {
          return `${member.toString()} - ${leaderboardEntries.find(entry => entry.userId === member.id).points} points`;
        }).join('\n')
      );
    interaction.reply({ embeds: [leaderboardEmbed] });
  }

if (command === 'removepoints') {
  try {
    const user = args.getUser('user');
    const points = args.getInteger('points');
    const memberId = user.id;

    // Check if points is a positive integer
    if (points <= 0) {
      interaction.reply('Points must be a positive integer!');
      return;
    }

    const existingEntry = await Leaderboard.findOne({ where: { userId: memberId } });
    if (existingEntry) {
      // Update existing entry with new points
      if (existingEntry.points < points) {
        interaction.reply(`You cannot remove more points than ${user.username} has!`);
        return;
      }
      await existingEntry.update({ points: existingEntry.points - points });
      interaction.reply(`Removed ${points} points from ${user.username}!`);
    } else {
      interaction.reply(`${user.username} does not have any points to remove!`);
    }
  } catch (error) {
    console.error(error);
    interaction.reply('An error occurred while removing points!');
  }
  }
});


client.login(process.env.CLIENT_TOKEN); // signs the bot in with token
