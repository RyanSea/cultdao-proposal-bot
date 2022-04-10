//config
const {hermes, alchemy, privateKey} = require('../config/config.json')
const { abi } = require('../config/cult.json')
const timelock_abi  = require('../config/timelock.json').abi
//discord
const ethers = require('ethers');
const { Client, Intents, MessageEmbed} =  require('discord.js');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGES] });
//smart contracts
const provider = new ethers.providers.JsonRpcProvider(alchemy);
const signer = new ethers.Wallet(privateKey, provider);
const cult = new ethers.Contract("0x0831172B9b136813b0B35e7cc898B1398bB4d7e7", abi , signer)
const timelock = new ethers.Contract("0x2686Ca30eDB7EC24FbB7cE39B7ef242dCE035945", timelock_abi , signer)

//exports
exports.bot = bot;
exports.MessageEmbed = MessageEmbed;
exports.provider = provider;
exports.cult = cult;
exports.hermes = hermes;
exports.timelock = timelock;