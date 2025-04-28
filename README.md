# 실행 방법

### 이미지 pull
```bash
docker pull kingjinyong/my-nestjs-app:latest
```
### Docker 네트워크 만들기

```bash
docker network create my-network
```
---

### Postgres 컨테이너 네트워크 연결 실행

```bash
docker run -d --name database --network my-network -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=nestjs_dev -p 5432:5432 postgres:16
```

---

### NestJS 컨테이너 네트워크 연결 실행

```bash
docker run -d --name my-nestjs-container -p 3000:3000 kingjinyong/my-nestjs-app:latest
```

---
