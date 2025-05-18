# WebSocket Server (Node.js)

이 서비스는 이미지 변환 플랫폼을 위한 실시간 WebSocket 연결을 처리합니다. 분산 환경에서도 사용자 연결을 관리하며, 사용자 1명이 여러 클라이언트 세션을 가질 수 있도록 지원합니다. Redis를 사용하면 클러스터 전체에서 세션을 공유할 수 있습니다.

---

## Features

| Feature             | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| User Socket Mapping | 사용자 ID, 클라이언트 ID, WebSocket 인스턴스 간의 매핑 처리 |
| Redis Support       | Redis를 활용한 수평 확장 및 다중 서버 간 세션 공유 지원     |
| Graceful Disconnect | 소켓 연결 해제 시 자동 정리 및 클린업 처리                  |
| Flexible Modes      | 메모리 기반(local) 및 Redis 기반 모드 동시 지원(구현중)             |

---

## Project Structure

```bash
.
├── src
│   ├── main.ts                  # 서버 엔트리 포인트
│   ├── config/index.ts          # 환경변수 및 설정 로더
│   ├── lib/redis.ts             # Redis 클라이언트 초기화
│   └── socket/user-socket-map.ts # 사용자 ↔ 클라이언트 매핑 로직 (local / redis)
├── Dockerfile                   # Docker 이미지 빌드 정의
├── package.json                 # 의존성 및 실행 스크립트
├── tsconfig.json                # TypeScript 컴파일 설정
```

---

## Configuration

`.env` 파일 또는 환경변수로 아래와 같은 설정이 필요합니다:

```env
# 기본 설정
NODE_ENV=development        # 또는 "production"
LOG_LEVEL=info              # "debug", "warn", "error" 중 선택

# API 서버 주소
API_SERVER_URL=http://localhost:8080
# 배포 시:
# API_SERVER_URL=https://api.image-converter.yubinshin.com

# CORS 허용 도메인
CLIENT_ORIGIN=http://localhost:5173
# 배포 시:
# CLIENT_ORIGIN=https://image-converter.yubinshin.com

# WebSocket 서버 주소
CLIENT_SOCKET_URL=ws://localhost:4000
WORKER_SOCKET_URL=ws://localhost:4001
# 배포 시:
# CLIENT_SOCKET_URL=wss://client-socket.image-converter.yubinshin.com
# WORKER_SOCKET_URL=wss://worker-socket.image-converter.yubinshin.com

# 🔌 내부 서버 포트
CLIENT_SOCKET_PORT=4000
WORKER_SOCKET_PORT=4001

# 🛠 Redis 설정
REDIS_URL=redis://default:local@localhost:6379
REDIS_DB=0
```

---

## 🚀 Running

### Development

```bash
npm install
npm run dev
```

### Production

```bash
npm run build
node dist/main.js
```

---

## Docker

```bash
docker build -t websocket-server .
docker run -p 3001:3001 --env-file .env websocket-server
```

---

## Example Workflow

1. 클라이언트가 `{ userId, clientId }`로 연결합니다
2. 연결 정보가 메모리 또는 Redis에 등록됩니다
3. 다른 서비스(예: API 서버)는 Redis를 통해 해당 사용자 연결 여부를 조회할 수 있습니다
4. 연결 종료 시 자동으로 해당 매핑이 제거됩니다

---

## Dependencies

- `ws`: WebSocket 서버
- `ioredis`: Redis 클라이언트
- `dotenv`: 환경변수 로더
- `ulid`: clientId 생성 시 사용 (시간순 정렬 및 충돌 방지에 유리)

---

## Author

**Yubin Shin**
Real-time Architecture, Redis Integration
