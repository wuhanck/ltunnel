'use strict'

const open = require('./tcp-proxy/tcp-src.js').open
const ReqPubOpen = require('./req-resp-pub-prv/req-pub.js').open

console.log(process.argv)

const src_port = parseInt(process.argv[2])
const src_host = '0.0.0.0'

const req_port = src_port + 10000
const req_host = '0.0.0.0'
const MAX_STREAMS = 4096

const req_srv = ReqPubOpen(req_port, req_host, MAX_STREAMS)
open(src_port, src_host, req_srv)

req_srv.start()
