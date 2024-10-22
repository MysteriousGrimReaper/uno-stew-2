let args = process.argv
args = args.slice(2)
const fs = require("fs")
const path = require("path")
console.log(args)
switch (args[0]) {
    case "deck":
        let deck_string = "color,icon,wild,flex,double,modifiers\n"
        const colors = [
            'r', 'g', 'b', 'y', 'm', 'o', 'p', 's', 'i', 'a', 'j'
        ]
        const j_colors = ['r', 'g', 'b', 'j']
        const red_flag = args.includes("all-red")
        const jelly_flag = args.includes("jelly")
        const wild_flag = args.includes("all-wild")
        let icon = args.find((a) => a.startsWith("icon:"))
        if (!icon) {
            throw Error("No icon submitted")
        }
        icon = icon.slice(5)
        console.log(icon)
        for (let i = 0; i < 11; i++) {
            const color = colors[i]
            const j_color = j_colors[i % j_colors.length]
            for (let j = 0; j < 10; j++) {
                for (const split_icon of icon.split(",")) {
                    const card = {
                        color: "",
                        icon: split_icon,
                        wild: "",
                        flex: "",
                        double: "",
                        modifiers: ""
                    }
                    if (red_flag) {
                        card.color = "r"
                    }
                    else if (jelly_flag) {
                        card.color = j_color
                    }
                    else {
                        card.color = color
                    }
                    if (wild_flag) {
                        card.wild = "true"
                    }
                    const card_string = Object.values(card).join(",") + "\n"
                    deck_string += card_string
                }
                
            }
        }
        const deck_name = `${icon}${wild_flag ? `-wild` : (red_flag ? `-red` : (jelly_flag ? `-jelly` : ``))}`
        fs.writeFile(`./src/decks/${deck_name}.csv`, deck_string, (err) => {
            if (err) {
                console.log(`Error with reading file: ${err}`)
            }
        })
        let config = fs.readFileSync(`./config.json`, {encoding: 'utf-8'}, (err) => {
            if (err) {
                console.log(`Error with reading file: ${err}`)
            }
        })
        config = config.replace(/"deck": ".+"/, `"deck": "${deck_name}"`)
        fs.writeFileSync(`./config.json`, config, (err) => {
            if (err) {
                console.log(`Error with writing file: ${err}`)
            }
        })

}
/**
 * When the argument is "deck":
 *  write to a file the following string, given the following flags:
 *      /by default, get put in all 11 colors
 *      /if "jelly" is a flag, set the color of all cards to red, green, blue, and jelly
 *      /if "all-red" is a flag, set the color of all cards to red 
 *      /if "all-wild" is a flag, set all cards to be a wild card
 *      /check for a "icon:[symbol]" flag and set all cards to have that symbol
 *      /if [symbol] is a comma separated list, alternate between the icons given
 */