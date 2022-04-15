const { MessageEmbed, cult } = require('./initialize.js')
const { formatNum, romanize, altText, trim, proposalStatus } = require('./utils.js')

// proposal id => phone-formatted discord embed
async function createEmbed(id) {

    let details = (await cult.queryFilter('ProposalCreated'))
        .filter(p => String(p.args.id) === id)
        .map(p => p.args.description)
    details = JSON.parse(details)

    let proposal = await cult.proposals(id)
    let docs = trim(details.file)
    let social = trim(details.socialChannel)
    let misc = trim(details.links)
    let title = altText(details.projectName)
    let description = details.shortDescription.slice(0,500) + "...\n"
    let empty = '\u200b' // <- this allows for an empty field in an embed
    let meter = '🀰'  // 16 = 100%, so percentages will be divided by 6 to create their meter
    let color = Number(id) % 2 === 0 ? '#ffffff' : '#000000' // white = even : black = odd
    
    // voting metrics
    let yes = Number(proposal.forVotes) / 10 ** 18
    let no = Number(proposal.againstVotes) / 10 ** 18 
    let abstain = Number(proposal.abstainVotes) / 10 ** 18
    let total = yes + no + abstain
    let yes_percent = yes / total * 100
    let no_percent = no / total * 100

    let statusObj = await proposalStatus(proposal.startBlock, proposal.endBlock, yes, no, abstain)
    let status = statusObj.status    // passing or failing
    let ending = statusObj.timestamp // tells time left until voting starts (if pending) or finishes w/ timestamp

    // if title is short then center the text
    title = title.length < 19 ? `**${" ".repeat(10)}** ⚚ ${title} ⚚` : `⚚ ${title} ⚚`

    let embed = new MessageEmbed()

        .setThumbnail('https://files.peakd.com/file/peakd-hive/autocrat/23viTFGe8wKCnmwBbcoL9rBJCn8raDomS3TjnA5AAunkmbkdRy5UuNQHunPCNgvM8kqYu.png')
        .setColor(color) // white
        .addFields (

            // title
            { name: title, 
            value: "~".repeat(160), 
            inline: false},

            // voting metrics
            { name: altText(`Approve:`), 
            value: `${formatNum(yes)} | **${formatNum(yes_percent)}%**`, // x votes | y% of total
            inline: false } ,
            { name: meter.repeat(Math.floor(yes_percent / 6)) || empty,  // 🀰🀰🀰🀰🀰 XOR empty field
            value: '- - '.repeat(10), 
            inline: false
            },
            { name: altText("Reject:"), 
            value: `${formatNum(no)} | **${formatNum(no_percent)}%**`,
            inline: false },
            { name: meter.repeat(Math.floor(no_percent / 4)) || empty,
            value: "~".repeat(160),
            inline: false},

            // proposal details
            { name: altText(`${status}`), value: empty, inline:false },
            { name: altText("Description:"), value: description || empty, inline:false },
            { name: altText('Docs:'), value: docs, inline: false },
            { name: altText('Social'), value: social, inline: false},
            { name: altText('Misc:'), value: misc, inline: false },                                         // link Guardian's address on etherscan
            { name: altText('Guardian:'), value: `${details.guardianProposal} (${details.guardianDiscord})\nhttps://etherscan.io/address/${details.guardianAddress}`, inline: false },
            { name: ending, value: empty, inline: false }

        )
        .setFooter({text: `${"~".repeat(13)} ${altText("CVLT DAO Proposal")} ${romanize(id)} ${"~".repeat(13)}`})
        

    return embed
}

exports.createEmbed = createEmbed;