sudo apt-get update
sudo apt-get install -y apt-utils
sudo apt-get install -y build-essential
sudo apt-get install -y --no-install-recommends python3.5 python3-pip
sudo apt-get install -y ca-certificates curl prometheus-node-exporter cron gnupg git unzip ffmpeg

sudo firewall-cmd --state | true
sudo systemctl stop firewalld | true
sudo systemctl disable firewalld | true
sudo systemctl mask --now firewalld | true
sudo systemctl status firewalld | true

source /root/.bashrc

if ! nvm --version > /dev/null 2>&1; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | sudo bash
    source /root/.bashrc
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    nvm install 22.14.0
    nvm use v22.14.0
    nvm alias default v22.14.0
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

if ! bun --version > /dev/null 2>&1; then
    curl -fsSL https://bun.sh/install | sudo bash
    source /root/.bashrc
fi

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

npm install
npm run build

sudo touch /root/run.sh
sudo chmod +x /root/run.sh

APPDIR=`pwd`

echo "
#!/bin/bash
source /root/.bashrc

cd $APPDIR

while true
do
npm run start
sleep 1
done
" | sudo tee /root/run.sh

sudo touch /lib/systemd/system/mediasoup.service

echo "
[Unit]
Description=mygreatest bun app to make the world great again!
Documentation=https://www.mediasoup.com
After=network.target

[Service]
Type=simple
User=root
ExecStart=/bin/bash /root/run.sh
Restart=always
RestartSec=1s

[Install]
WantedBy=multi-user.target
" | sudo tee /lib/systemd/system/mediasoup.service

sleep 5s

sudo systemctl status mediasoup --no-pager --lines=20 -l

sudo systemctl daemon-reload
sudo systemctl restart mediasoup