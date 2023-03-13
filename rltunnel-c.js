'use strict'

const open = require('./tcp-proxy/tcp-src.js').open
const ReqPrvOpen = require('./req-resp-pub-prv/req-prv.js').open

console.log(process.argv)

const src_port = parseInt(process.argv[2])
const src_host = '0.0.0.0'

const c_origin = process.argv[4]

const req_host = process.argv[3] + ':' + (parseInt(process.argv[2]) + 10000).toString()
const req_path = `ws://${req_host}/`
const MAX_STREAMS = 4096

const req_srv = ReqPrvOpen(req_path, c_origin, MAX_STREAMS)
open(src_port, src_host, req_srv)

req_srv.start()
