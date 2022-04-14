const { provider } = require('./initialize.js')

    /*//////////////////////////////////////////////////////////////
                            UTILITY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

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

    num = Number(num)
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

// id + proposalChannel => message object of proposal
async function getProposal(id, channel) {

    let proposal
    await channel.messages.fetch()
    .then(messages => messages.forEach(message => {

        if(message.embeds.length && message.embeds[0].footer){
            if (message.embeds[0].footer.text.split(" ")[4] === romanize(id)) {
                proposal = message
            }
        }
    }))

    return proposal
}

// channel => removes any failing proposal with elapsed time
async function clear(channel) {

    let now = Date.now() / 1000
    await channel.messages.fetch()
    .then(messages => messages.forEach(async message => {

        if(message.embeds.length) {
            if (message.embeds[0].fields[5].name.startsWith(altText('Failing'))){

                let end = message.embeds[0].fields[11].name
                end = end.slice(end.indexOf('t:') + 2, end.indexOf(':R'))
                if (now > end) {
                    await message.delete()
                }
                
            }
            
        }
    }))
    
}

// Hi! => 𝐇𝐈!
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

// voting (endBlock || startBlock) + currentBlock=> discord-formatted timestamp of when voting ends || begins
async function timestamp(block, currentBlock) {
    block = Number(block)

    let remaining = Math.abs(block - currentBlock) * 13.5 // estimated 13.5 second blocktime 
    let current = await provider.getBlock(currentBlock)
    let eta = Math.floor(current.timestamp + remaining)

    // 'approx' if less than a day (86400 seconds)
    return remaining > 86400 ? `<t:${eta}:R>` : `approx. <t:${eta}:R>`
}

// vote statistics + start/end bocks => proposal status object
async function proposalStatus(startblock, endblock, yes, no, abstain) {

    let current = await provider.getBlockNumber()
    let _status 
    if (current < startblock) {
        _status = "Pending"
    } else if (yes + no + abstain < 1000000000) {
        _status = "Failing (Quorum)"
    } else if (yes > no){
        _status = "Passing!"

    } else if (no >= yes ) {
        _status = "Failing"
    } 
    
    let _timestamp
    if(_status === "Pending") {
        _timestamp = await timestamp(startblock, current)
        _timestamp = altText("Voting period begins: ") + _timestamp
    }  else {
        _timestamp = await timestamp(endblock, current)
        _timestamp = altText("Voting period ends: ") + _timestamp
    }

    return { status : _status, timestamp : _timestamp }

}

// exports
exports.formatNum = formatNum;
exports.romanize = romanize;
exports.altText = altText;
exports.trim = trim;
exports.timestamp = timestamp;
exports.getProposal = getProposal;
exports.clear = clear
exports.proposalStatus = proposalStatus
