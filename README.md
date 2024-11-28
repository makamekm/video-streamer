## Getting Started

First, run the development server:

```bash
npm run dev
```

```bash
if ! sudo docker info > /dev/null 2>&1; then
  sudo apt-get update; sudo apt-get install ca-certificates curl gnupg -y; sudo install -m 0755 -d /etc/apt/keyrings; curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg; sudo chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null; sudo apt-get update; sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
fi

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

sudo apt-get install git ffmpeg psmisc -y

sudo curl -fsSL https://raw.githubusercontent.com/filebrowser/get/master/get.sh | sudo bash

sudo ufw allow 443/tcp
sudo ufw allow 80/tcp

nvm install 18
nvm use 18
```

```bash
filebrowser -a 0.0.0.0 --noauth -r /home/makame/projects/video-streamer/files
```