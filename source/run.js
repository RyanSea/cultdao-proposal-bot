const { bot, hermes, provider } = require('../utils/initialize.js')
const { createEmbed } = require('../utils/utils.js');



bot.on('ready', () => {
    console.log('Hermes is awakened!')
})

bot.on('messageCreate', async msg => {
    const server = bot.guilds.cache.get('847216800067485716')
    const proposalChannel = server.channels.cache.find(channel => channel.name === "proposals")

    if (msg.content.startsWith('!test')){
        
        let embed = await createEmbed('18')
        await proposalChannel.send({embeds: [embed]})
    }

    if (msg.content.startsWith('roman')){

        let num = msg.content.split(" ")[1]
        msg.channel.send(romanize(num))
    }

    if (msg.content.startsWith('letter')) {

        let letter = msg.content.split(" ")[1]
        msg.channel.send(oldEnglish(letter))
    }
    
})

bot.login(hermes)




