'use strict'

const open = require('./udp-proxy/udp-sink').open
const RespPrvOpen = require('./req-resp-pub-prv/resp-prv.js').open

console.log(process.argv)

const sink_port = parseInt(process.argv[4])
const sink_host = process.argv[6] === undefined ? '127.0.0.1' : process.argv[6]

const c_origin = process.argv[5]

const resp_host = process.argv[2] + ':' + (parseInt(process.argv[3]) + 10000).toString()
const resp_path = `ws://${resp_host}/`

const resp_prv = RespPrvOpen(resp_path, c_origin)
open(sink_port, sink_host, resp_prv)

resp_prv.start()
resp_prv.on_connected(()=>{console.log(`UDP:SINK:${sink_host}:${sink_port} connected.`)})
resp_prv.on_disconnected(()=>{console.log(`UDP:SINK:${sink_host}:${sink_port} disconnected.`)})
