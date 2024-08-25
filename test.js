parse = (message_content) => {
    message_content = message_content.toLowerCase().replace(/\s+/g, '')
    let index = message_content.length - 1
    const play_object = {}
    const inputs_to_find = {
        "f": "flex"
    }
    for (let text of Object.values(inputs_to_find)) {
        if (message_content.includes(text)) {
            message_content.replace(text, '')
            play_object[text] = true
        }
    }
    for (let text of Object.keys(inputs_to_find)) {
        if (message_content.includes(text)) {
            message_content.replace(text, '')
            play_object[inputs_to_find[text]] = true
        }
    }
    while (index >= 0) {
        if (isNaN(message_content[index])) {
            const number = message_content.slice(index + 1)
            switch (message_content[index]) {
                case `d`:
                    play_object["dish"] = parseInt(number)
                    break
            }
            
            message_content = message_content.slice(0, index)
        }
        index--
    }
    return play_object
}

console.log(parse("1d5f"))