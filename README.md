# ltunnel
a very simple local-tunnel.

usage:

//public server    
node ltunnel-s server-port token

//for example on a public server-ip 8.8.8.8    
node ltunnel-s 10086 xyz

NOTE: USE 1xxxx port

//NATed machine forward local-port to public local-host default to localhost
node ltunnel-c server-ip server-port local-port token local-host

//for example forward 22 to public    
node ltunnel-c 8.8.8.8 10086 22 xyz


//any machine wants to connect to your NATed machine    
use the server-ip:server-port

//for example    
ssh -p 10086 some-user@8.8.8.8
