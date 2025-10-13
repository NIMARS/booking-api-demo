# Booking-API-Demo

Мини-API для бронирования мест на мероприятие.  
Один пользователь не может забронировать дважды на одно событие.  
Защита от овербукинга, валидация, идемпотентность.

## Стек

* Node.js 20, TypeScript (ESM, NodeNext)
* Fastify 5, Zod 4
* PostgreSQL 16 (`pg`)
* Jest (E2E), Artillery (bookingarmy нагрузочное)

---

## Быстрый старт

```bash
# 1) Установка
npm i

# 2) Настройка переменных окружения
# пример .env (см. ниже)
cp .env.example .env

# 3) Миграции и сиды
npm run migrate
npm run seed

# 4) Запуск
npm run dev
# или prod-сборка:
# npm run build && npm start
```

**Базовый URL:** `http://localhost:3000`

### .env (пример)

``` bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app
PORT=3000
```

---

## Схема БД

### events

* `id SERIAL PRIMARY KEY`
* `name VARCHAR NOT NULL`
* `total_seats INT NOT NULL CHECK (total_seats >= 0)`

### bookings

* `id SERIAL PRIMARY KEY`
* `event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE`
* `user_id VARCHAR NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
* `UNIQUE (event_id, user_id)`

SQL миграции кладутся в `src/db/migrations/*.sql` и прогоняются скриптом `npm run migrate`.

---

## Поведение/статусы (booking process)

| Сценарий                  | Статус | Тело ответа (пример)                                       |
| ------------------------- | :----: | ---------------------------------------------------------- |
| Создано бронирование      |   201  | `{ booking_id, event_id, user_id, created_at }`            |
| Событие не найдено        |   404  | `{ "error": "event_not_found" }`                           |
| Нет мест / уже бронировал |   409  | `{ "error": "sold_out" }` / `{ "error":"already_booked" }` |
| Невалидные данные         |   422  | `{ "error": "validation_error", details: ... }`            |
| Анти-DDOS/Rate limit*     |   429  | `{ "error": "rate_limited" }`                              |

* 429 — если включён лимитер на уровне API/прокси (опционально).

---

## Эндпоинты

### POST `/api/bookings/reserve`

Забронировать место.

### Headers (опционально)

`Idempotency-Key: <uuid>` — один и тот же ключ вернёт идентичный ответ при повторе.

### Body

```json
{
  "event_id": 1,
  "user_id": "user123"
}
```

### 201 Created (пример)

```json
{
  "booking_id": 123,
  "event_id": 1,
  "user_id": "user123",
  "created_at": "2025-10-13T12:34:56.000Z"
}
```

### 409 already_booked

```json
{ "error": "already_booked" }
```

### 409 sold_out

```json
{ "error": "sold_out" }
```

### 404 event_not_found

```json
{ "error": "event_not_found" }
```

### 422 validation_error

```json
{
  "error": "validation_error",
  "details": { ... }
}
```

### cURL

```bash
curl -X POST http://localhost:3000/api/bookings/reserve \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 4c3e7f2a-5f3b-4a0b-9e0e-111111111111" \
  -d '{"event_id":1,"user_id":"user123"}'
```

---

### GET `/api/events/:id/availability`

Остаток мест по событию.

### 200 OK (пример)

```json
{
  "event_id": 1,
  "total_seats": 100,
  "booked": 87,
  "left": 13
}
```

### 404

```json
{ "error": "event_not_found" }
```

### cURL_

```bash
curl http://localhost:3000/api/events/1/availability
```

---

### Служебные

* `GET /health` → `200 {"status":"ok"}`
* `GET /ready` → `200 {"status":"ready"}` (или `503 {"status":"not_ready","reason":"db"}` при недоступной БД)

---

## Защита от овербукинга

* **Транзакционный advisory-lock**: `pg_advisory_xact_lock(namespace, event_id)` — сериализует бронирования в рамках одного `event_id`.
* **Атомарная вставка**: `INSERT ... SELECT ... WHERE used < total` (через CTE), чтобы проверка лимита выполнялась на стороне БД за один шаг.
* **UNIQUE (event_id,user_id)** — железно запрещает повторную бронь пользователем.

Это даёт корректность под нагрузкой:  
при гонке ровно N успешных ответов `201` (по количеству мест), остальные — `409 sold_out`.

---

## Тесты

### E2E (Jest)

* Happy-path, duplicate, sold_out, idempotency, not_found, validation.
* Конкурентный стресс-тест: 200 параллельных запросов на событие с 50 мест → ожидаемо `201:50`, `409:150`.

```bash
npm test
```

### Нагрузочный (опционально, Artillery)

Пример профиля см. в проекте; запуск:

```bash
npx artillery run bookingarmy.yml
```

---

## Идемпотентность

Поддерживается заголовок `Idempotency-Key`.  
Один и тот же ключ для одинаковых запросов вернёт точно такой же ответ и статус.

---

## Команды npm

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "migrate": "tsx src/db/migrate.ts",
    "seed": "tsx src/db/seed.ts",
    "test": "jest"
  }
}
```

---

## Лицензия

MIT (или любая другая — на выбор).
