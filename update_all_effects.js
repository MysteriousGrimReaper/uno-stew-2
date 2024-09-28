const fs = require("fs")
const effects = fs.readdirSync("./src/effects", {withFileTypes: false})
console.log(effects)
let write_string = "color,icon,wild,flex,double,modifiers"
const colors = [`r`, `g`, `y`, `b`, `p`, `m`, `o`, `s`, `i`, `a`]
for (const effect of effects) {
    for (const color of colors) {
        write_string += `\n`
        write_string += `${color},${effect.split(".")[0]},,,,`
    }
}
fs.writeFile("./src/decks/all-effects.csv", write_string, err => {
    if (err) {
        console.log(`Error: ${err}`)
    }
})
