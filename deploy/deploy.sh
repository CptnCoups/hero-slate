#!/usr/bin/env bash
# Build the static site and publish it to the hero-slate container on Unraid.
# Usage: deploy/deploy.sh   (from the repo root, with `ssh unraid` working)
set -euo pipefail

APPDATA=/mnt/user/appdata/hero-slate

npm run build

ssh unraid "mkdir -p $APPDATA/www.new $APPDATA/conf"
tar -C build -cf - . | ssh unraid "tar -C $APPDATA/www.new -xf -"
scp -q deploy/nginx.conf unraid:$APPDATA/conf/default.conf
ssh unraid "rm -rf $APPDATA/www.old && { [ ! -d $APPDATA/www ] || mv $APPDATA/www $APPDATA/www.old; } && mv $APPDATA/www.new $APPDATA/www && rm -rf $APPDATA/www.old"

# Create the container on first deploy; afterwards just reload nginx.
if ssh unraid "docker inspect hero-slate >/dev/null 2>&1"; then
	ssh unraid "docker restart hero-slate >/dev/null"
else
	# Matches the Unraid template deploy/my-hero-slate.xml (installed in
	# /boot/config/plugins/dockerMan/templates-user/), so the Docker tab can edit it.
	scp -q deploy/my-hero-slate.xml unraid:/boot/config/plugins/dockerMan/templates-user/my-hero-slate.xml
	ssh unraid "docker run -d --name hero-slate --net=bridge --restart unless-stopped \
		-l net.unraid.docker.managed=dockerman \
		-p 127.0.0.1:3500:80 \
		-v $APPDATA/www:/usr/share/nginx/html:ro \
		-v $APPDATA/conf/default.conf:/etc/nginx/conf.d/default.conf:ro \
		nginx:1.27-alpine"
fi

echo "Deployed. Local check: ssh unraid curl -sI http://127.0.0.1:3500/gimdak"
