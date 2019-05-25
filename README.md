# ltunnel
a very simple local-tunnel.

usage:

//public server    
node ltunnel-s server-port

//for example on a public server-ip 8.8.8.8    
node ltunnel-s 10086

NOTE: USE 1xxxx port

//NATed machine forward local-port to public    
node ltunnel-c server-ip server-port local-port

//for example forward 22 to public    
node ltunnel-c 8.8.8.8 10086 22


//any machine wants to connect to your NATed machine    
use the server-ip:server-port

//for example    
ssh -p 10086 some-user@8.8.8.8
