# OSX 10.9.2
# create network
# ifconfig until ipaddress
# check bootpd.plist that it mataches address
cp bootpd.plist /etc/bootpd.plist
sudo /usr/libexec/bootpd -d -i en0
sudo node dns-server.js
sudo node server/server.js --port 80

