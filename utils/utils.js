const { MessageEmbed, cult, provider } = require('./initialize.js')


// 10000000.12345 => 10,000,000.123
function formatNum(num) {

    num = String(num)
    let decimals = ""
    if (num.indexOf(".") >= 0) {
        num = num.split(".")
        decimals += "." + num[1].slice(0,2)
        num = num[0]
    }
    let result = ""
    for(let i = 0; i < num.length; i++) {
  
      result += num[i]
      if((i + 1 - num.length) % 3 === 0 && i + 1 < num.length) result += ","
      
    }

    return result + decimals
}

// 18 => XVIII
function  romanize(num) {

    const map = {
      "𝐌":  1000,
      "𝐂𝐌": 900,
      "𝐃":  500,
      "𝐂𝐃": 400,
      "𝐂":  100,
      "𝐗𝐂": 90,
      "𝐋":  50,
      "𝐗𝐋": 40,
      "𝐗":  10,
      "𝐈𝐗": 9,
      "𝐕":  5,
      "𝐈𝐕": 4,
      "𝐈":  1,
    };  
    let result = ''
    
    for (key in map) {  
      const repeatCounter = Math.floor(num / map[key]);
      
      if (repeatCounter !== 0) {
        result += key.repeat(repeatCounter);
      }
      
      num %= map[key];
      
      if (num === 0) return result;
    }
    return result
}
// R! => 𝐑!
function altText(text){

    const map = {
        "A" : "𝐀",
        "B" : "𝐁",
        "C" : "𝐂",
        "D" : "𝐃",
        "E" : "𝐄",
        "F" : "𝐅",
        "G" : "𝐆",
        "H" : "𝐇",
        "I" : "𝐈",
        "J" : "𝐉",
        "K" : "𝐊",
        "L" : "𝐋",
        "M" : "𝐌",
        "N" : "𝐍",
        "O" : "𝐎",
        "P" : "𝐏",
        "Q" : "𝐐",
        "R" : "𝐑",
        "S" : "𝐒",
        "T" : "𝐓",
        "U" : "𝐔",
        "V" : "𝐕",
        "W" : "𝐖",
        "X" : "𝐗",
        "Y" : "𝐘",
        "Z" : "𝐙",
        " " : " ",
        "0" : "𝟎",
        "1" : "𝟏",
        "2" : "𝟐",
        "3" : "𝟑",
        "4" : "𝟒",
        "5" : "𝟓",
        "6" : "𝟔",
        "7" : "𝟕",
        "8" : "𝟖",
        "9" : "𝟗"
    }
    
    return text.toUpperCase().split("")
        .map(x => Object.keys(map).includes(x) ? map[x] : "\\" + x )
        .join("")
    
}

// discord fields can only be 1024 characters, function trims if more
function trim(field) {
    return field.length < 1024 ? field : field.slice(0,1020) + '...'
}

// voting endBlock => discord-formatted timestamp of when voting ends
async function voteEndingTimestamp(endBlock) {
    endBlock = Number(endBlock)

    let currentBlock = await provider.getBlockNumber()
    let voteTime = (endBlock - currentBlock) * 13.5 // estimated 13.5 second blocktime 
    let current = await provider.getBlock(currentBlock)
    let end = Math.floor(current.timestamp + voteTime)

    return end > 86400 ? `<t:${end}:R>` : `approx. <t:${end}:R>`
}

// proposal id => discord embed
async function createEmbed(id) {

    let details = (await cult.queryFilter('ProposalCreated'))
        .filter(p => String(p.args.id) === id)
        .map(p => p.args.description)
    details = JSON.parse(details)

    let proposal = await cult.proposals(id)
    let ending = await voteEndingTimestamp(proposal.endBlock)
    let docs = trim(details.file)
    let social = trim(details.socialChannel)
    let misc = trim(details.links)
    let title = altText(details.projectName)
    let description = details.shortDescription.slice(0,500) + "...\n"
    let empty = '\u200b' // <- this allows for an empty field in an embed
    let meter = '🀰'  // 25 = 100%, so percentages will be divided by 4 to create their meter
    
    // voting metrics
    let yes = Number(proposal.forVotes) / 10 ** 18
    let no = Number(proposal.againstVotes) / 10 ** 18
    let abstain = Number(proposal.abstainVotes) / 10 ** 18
    let total = yes + no + abstain
    let yes_percent = yes / total * 100
    let no_percent = no / total * 100

    let embed = new MessageEmbed()

        .setThumbnail('https://files.peakd.com/file/peakd-hive/autocrat/23viTFGe8wKCnmwBbcoL9rBJCn8raDomS3TjnA5AAunkmbkdRy5UuNQHunPCNgvM8kqYu.png')
        .setColor('#ffffff') // white
        .addFields (

            // title
            { name: `**                          ** ⚚ ${title} ⚚`, 
            value: "~~".repeat(135), 
            inline: false},

            // voting metrics
            { name: altText(`Approve:`), 
            value: `${formatNum(yes)} | **${formatNum(yes_percent)}%**`, // x | y%
            inline: false } ,
            { name: meter.repeat(Math.floor(yes_percent / 4)) || empty,       // ➨➨➨➨➨➨➨➨
            value: '- - '.repeat(10), 
            inline: false
            },
            { name: altText("Reject:"), 
            value: `${formatNum(no)} | **${formatNum(no_percent)}%**`,
            inline: false },
            { name: meter.repeat(Math.floor(no_percent / 4)) || empty,
            value: "~~".repeat(135),
            inline: false},

            // proposal details
            { name: altText("Description:"), value: description || empty, inline:false },
            { name: altText('Docs:'), value: docs, inline: false },
            //{ name: 'Social', value: social, inline: false},
            { name: altText('Misc:'), value: misc, inline: false },
            { name: altText('Guardian:'), value: `${details.guardianProposal} (${details.guardianDiscord})\nhttps://etherscan.io/address/${details.guardianAddress}`, inline: false },
            { name: altText(`Voting period ends (approx.):`) + `${ending}`, value: '\u200b', inline: false }

        )
        .setFooter({text: `~~~~~~~~~~~~~~~~~~~~~~~~~~~ ${altText("CVLT DAO Proposal")} ${romanize(id)} ~~~~~~~~~~~~~~~~~~~~~~~~~~~`})
        

    return embed
}

exports.createEmbed = createEmbed;
