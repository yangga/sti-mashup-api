# STI Mashup API

## INSTALLATION

```bash
npm install
```

---

## YOU SHOULD KNOW THIS

### @serverless-seoul/dynamorm 은 .env로 환경변수 선언이 안됩니다

* NestJS는 dotenv를 사용하여 process.env를 구성합니다. 이 때 .env 파일에 있는 내용을 사용하는데, @serverless-seoul/dynamorm는 dotenv가 초기화되기 전에 process.env에 있는 환경변수를 사용합니다.
* 그러므로, 구동 시 OS 레벨의 환경변수에 원하는 환경변수 값을 넣거나, nodemon을 사용할 경우 nodemon-[ENV].json 에 환경변수를 선언해야 합니다.

---
