#!/usr/bin/env bash
# Slacord 배포 스크립트 — 로컬 빌드 → 산출물만 컨테이너 전송 → PM2 재시작
# 사용: ./scripts/deploy.sh [web|server|all]
set -euo pipefail

DOCKER_HOST="unix:///Users/kscold/.colima/default/docker.sock"
export DOCKER_HOST
CONTAINER="ubuntu-slacord"
PROJECT_DIR="/Users/kscold/Desktop/slacord"
REMOTE_DIR="/app/slacord"

target="${1:-all}"

log() { echo "▸ $1"; }

deploy_server() {
    log "서버 빌드 중..."
    cd "$PROJECT_DIR/packages/server"
    yarn build 2>&1 | tail -1

    log "서버 산출물 전송 중..."
    tar czf /tmp/slacord-server-dist.tar.gz dist/
    docker cp /tmp/slacord-server-dist.tar.gz "$CONTAINER:/tmp/"
    docker exec "$CONTAINER" sh -c "cd $REMOTE_DIR/packages/server && rm -rf dist && tar xzf /tmp/slacord-server-dist.tar.gz && rm /tmp/slacord-server-dist.tar.gz"
    rm /tmp/slacord-server-dist.tar.gz

    log "백엔드 재시작..."
    docker exec "$CONTAINER" pm2 restart slacord-backend --update-env
    log "서버 배포 완료"
}

deploy_web() {
    log "프론트 빌드 중..."
    cd "$PROJECT_DIR/packages/web"
    yarn build 2>&1 | tail -1

    log "프론트 산출물 전송 중..."
    tar czf /tmp/slacord-web-next.tar.gz .next/
    docker cp /tmp/slacord-web-next.tar.gz "$CONTAINER:/tmp/"
    docker exec "$CONTAINER" sh -c "cd $REMOTE_DIR/packages/web && rm -rf .next && tar xzf /tmp/slacord-web-next.tar.gz && rm /tmp/slacord-web-next.tar.gz"
    rm /tmp/slacord-web-next.tar.gz

    log "프론트엔드 재시작..."
    docker exec "$CONTAINER" pm2 restart slacord-frontend --update-env
    log "프론트 배포 완료"
}

verify() {
    log "검증 중..."
    sleep 3
    docker exec "$CONTAINER" pm2 list
    docker exec "$CONTAINER" sh -lc '
        echo "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/) /"
        echo "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8082/api/docs) /api/docs"
    '
    log "배포 검증 완료"
}

case "$target" in
    server)  deploy_server; verify ;;
    web)     deploy_web; verify ;;
    all)     deploy_server; deploy_web; verify ;;
    *)       echo "사용법: $0 [web|server|all]"; exit 1 ;;
esac
