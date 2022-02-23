const fs = require('fs')

function dsConfigWrite(file, key, value) {
  let rawdata = fs.readFileSync(file)
  const config = JSON.parse(rawdata)
  config[key] = value
  rawdata = JSON.stringify(config, null, 2)
  fs.writeFileSync(file, rawdata)
}

function dsConfigRead(file) {
  const rawdata = fs.readFileSync(file)
  const config = JSON.parse(rawdata)
  return config
}

module.exports = {
  dsConfigWrite,
  dsConfigRead
}