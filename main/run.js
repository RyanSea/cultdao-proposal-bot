const { bot, hermes, provider, timelock,cult } = require('../utils/initialize.js')
const { createEmbed } = require('../utils/createEmbed.js');
const { getProposal, clear, altText } = require('../utils/utils.js');

    /*//////////////////////////////////////////////////////////////
                            CONTRACT LISTENERS
    //////////////////////////////////////////////////////////////*/

// listeners can fire multiple times for a single emit
// the proposals array is to keep track of ProposalCreate's that have alrady been detected
var proposals = []


cult.on('ProposalCreated', async (
    id, 
    sender, 
    targets, 
    values, 
    signatures, 
    calldatas, 
    startBlock, 
    endBlock, 
    description) => {

    id = String(id);
    // for some reason server+channel can't be defined outside of listener
    let server = bot.guilds.cache.get('847216800067485716') 
    let proposalChannel = server.channels.cache.find(channel => channel.name === "proposals")
    if (proposals.includes(id)) return 
    let embed = await createEmbed(id)

    await proposalChannel.send({emebeds: [embed]})
    proposals.push(id)

    await clear(proposalChannel) // clears any expired proposal that failed
})

// this is inefficient on Alchemy compute because it will create multiple embeds for a single emit
// because they fire multiple times
cult.on('VoteCast', async (sender, id, support, votes, reason) => {

    id = String(id)
    let server = bot.guilds.cache.get('847216800067485716')
    let proposalChannel = server.channels.cache.find(channel => channel.name === "proposals")
    let embed = await createEmbed(id)
    let proposal = await getProposal(id, proposalChannel)
    if (proposal){
        await proposal.edit({embeds : [embed]})
    } else {
        await proposalChannel.send({embeds: [embed]})
    }

    await clear(proposalChannel)
})

cult.on('ProposalQueued', async (id, eta) => {

    id = String(id)
    let server = bot.guilds.cache.get('847216800067485716')
    let proposalChannel = server.channels.cache.find(channel => channel.name === "proposals")

    let proposal = await getProposal(id, proposalChannel)

    let embed
    if (proposal){
        embed = proposal.embeds[0]
    } else {
        embed = await createEmbed(id)
    }

    // change eta & status
    embed.fields[11].name = altText('Payout in: ') + `approx. <t:${eta}:R>`
    embed.fields[5].name = altText('Passed!')

    if (proposal) {
        proposal.edit({ embeds: [embed] })
    } else {
        proposalChannel.send({ embeds: [embed] })
    }
    
    await clear(proposalChannel)
})

cult.on('ProposalCanceled', async id => {

    id = String(id)
    let server = bot.guilds.cache.get('847216800067485716')
    let proposalChannel = server.channels.cache.find(channel => channel.name === "proposals")

    let proposal = await getProposal(id, proposalChannel)
    if(proposal) await proposal.delete()

    await clear(proposalChannel)
})

cult.on('ProposalExecuted', async id => {

    id = String(id)
    let server = bot.guilds.cache.get('847216800067485716')
    let proposalChannel = server.channels.cache.find(channel => channel.name === "proposals")

    let proposal = await getProposal(id, proposalChannel)
    if(proposal) await proposal.delete()

    await clear(proposalChannel)
})

    /*//////////////////////////////////////////////////////////////
                                BOT
    //////////////////////////////////////////////////////////////*/

bot.on('ready', () => {
    console.log('Hermes is awakened!')
})



bot.on('messageCreate', async msg => {
    const server = bot.guilds.cache.get('847216800067485716')
    const proposalChannel = server.channels.cache.find(channel => channel.name === "proposals")
    const testChannel = server.channels.cache.find(channel => channel.name === "test")

    if (msg.content.startsWith('!test')){
        
        let id = msg.content.split(" ")[1]
        if (!id) return

        try {
            let embed = await createEmbed(id)
            proposalChannel.send({embeds: [embed]})
        } catch (error) {
            msg.reply('That proposal id doesn\'t exist.')
        }
        
    }

    if (msg.content.startsWith('!alt')) {
        let text = msg.content.split(" ").slice(1).join(" ")
        if (!text) return
        msg.channel.send(altText(text))//
    }



    if (msg.content.startsWith('!summon proposals')) {

        let current = await provider.getBlockNumber()
        let proposals = await cult.queryFilter('ProposalCreated')
        let active_ids = proposals
                            .filter(proposal => Number(proposal.args.endBlock) > current)
                            .map(proposal => String(proposal.args.id))

        active_ids.forEach(async id => {
            let embed = await createEmbed(id)
            proposalChannel.send({embeds: [embed]})
        })

    }

    
    
})

bot.login(hermes)




