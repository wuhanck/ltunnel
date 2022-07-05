'use strict'

const argv = require('yargs/yargs')(process.argv.slice(2))
	.option('site', {
		demandOption: true,
		describe: 'location type',
		choices: ['cloud', 'local']
	})
	.option('binding-ip', {
		demandOption: true,
		describe: 'binding ip address',
	})
	.option('binding-port', {
		demandOption: true,
		describe: 'binding udp port',
	})
	.option('proxyed-ip', {
		demandOption: true,
		describe: 'proxyed ip address',
	})
	.option('proxyed-port', {
		demandOption: true,
		describe: 'proxyed udp port',
	})
	.option('ws-ip', {
		demandOption: true,
		describe: 'websocket server ip',
	})
	.option('ws-port', {
		demandOption: true,
		describe: 'websocket server port',
	})
	.option('ws-token', {
		demandOption: true,
		describe: 'websocket server token',
	})
	.version('1.0.0')
	.argv

const ReqPubOpen = require('./req-resp-pub-prv/req-pub.js').open
const src_open = require('./udppair-proxy/udppair-src.js').open

const RespPrvOpen = require('./req-resp-pub-prv/resp-prv.js').open
const sink_open = require('./udppair-proxy/udppair-sink.js').open

const kwargs = {}

kwargs.site = argv['site']

kwargs.binding_port = parseInt(argv['binding-port'])
kwargs.binding_ip = argv['binding-ip']

kwargs.proxyed_port = parseInt(argv['proxyed-port'])
kwargs.proxyed_ip = argv['proxyed-ip']

kwargs.ws_port = parseInt(argv['ws-port'])
kwargs.ws_ip = argv['ws-ip']
kwargs.ws_token = argv['ws-token']

console.log('args:')

if (kwargs.site === 'cloud') {
	kwargs.MAX_STREAMS = 4096
	console.log(kwargs)
	const valid = (token)=>(token === kwargs.ws_token)
	const req_srv = ReqPubOpen(kwargs.ws_port, kwargs.ws_ip, kwargs.MAX_STREAMS, valid)
	src_open(kwargs.binding_port, kwargs.binding_ip, req_srv, kwargs.proxyed_port, kwargs.proxyed_ip)
	req_srv.start()
} else {
	console.log(kwargs)
	const resp_path = `ws://${kwargs.ws_ip}:${kwargs.ws_port}/`
	const resp_prv = RespPrvOpen(resp_path, kwargs.ws_token)
	sink_open(kwargs.binding_port, kwargs.binding_ip, resp_prv, kwargs.proxyed_port, kwargs.proxyed_ip)
	resp_prv.start()
	resp_prv.on_connected(()=>{console.log(`udppair ${resp_path} connected`)})
	resp_prv.on_disconnected(()=>{console.log(`udppair ${resp_path} disconnected`)})
}
