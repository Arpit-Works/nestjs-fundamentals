# NestJS Fundamentals

A hands-on NestJS learning project. The app exposes a sample **User** API with in-memory data so you can practice core framework concepts without a database.

For an Express vs NestJS comparison and revision notes, see [Express vs nest.md](./Express%20vs%20nest.md).

## What I Learned

| Topic | What it does in this project |
| --- | --- |
| **Modules** | `AppModule` imports `UserModule`; feature code is grouped in `user/user.module.ts`. |
| **Controllers** | `UserController` defines HTTP routes under `/user` with decorators (`@Get`, `@Post`, etc.). |
| **Providers & services** | `UserService` is an `@Injectable()` provider registered in `UserModule`; the controller calls it for business logic. |
| **Pipes** | Global `ValidationPipe` in `main.ts` validates DTOs; `ParseIntPipe` parses route `id` params. |
| **Guards** | `RoleGuard` protects `DELETE /user/:id` (checks the `role` header). |
| **Middleware** | `ApiKeyMiddleware` runs on all `UserController` routes (checks `x-api-key`). |
| **class-validator** | `CreateUserDto` uses decorators like `@IsString()` and `@MinLength()`; `UpdateUserDto` extends it via `PartialType`. |
| **HTTP routes** | **GET**, **POST**, **PUT**, and **DELETE** are implemented on `/user`; **PATCH** uses the same pattern as PUT with `@Patch()` when you add partial updates. |

### Request flow (simplified)

```text
Request → Middleware (API key) → Guards (on protected routes) → Pipes → Controller → Service → Response
```

Global **interceptors** (`TransformInterceptor`) wrap successful responses in a consistent JSON shape.

## Project structure

```text
src/
├── main.ts                 # Bootstrap, global ValidationPipe & interceptor
├── app.module.ts           # Root module, middleware registration
├── middleware/
│   └── api-key.middleware.ts
├── guards/
│   └── role.guard.ts
├── user/
│   ├── user.module.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── dto/
│       ├── createUser-dto.ts
│       └── updateUser-dto.ts
└── utils/
    └── transform.interceptor.ts
```

## API overview (`/user`)

Base URL: `http://localhost:3000` (or `PORT` from the environment).

| Method | Path | Description | Extra requirements |
| --- | --- | --- | --- |
| `GET` | `/user` | List users (optional query `?name=` to filter) | Header `x-api-key: secret-key-123` |
| `GET` | `/user/:id` | Get one user by id | API key |
| `POST` | `/user` | Create user (body validated with `CreateUserDto`) | API key |
| `PUT` | `/user/:id` | Update user (body: `UpdateUserDto`) | API key |
| `DELETE` | `/user/:id` | Delete user | API key + header `role: admin` |

### Example requests

```bash
# List users
curl -H "x-api-key: secret-key-123" http://localhost:3000/user

# Create user (fields depend on CreateUserDto)
curl -X POST http://localhost:3000/user \
  -H "x-api-key: secret-key-123" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Alex\",\"id\":6}"

# Delete (admin only)
curl -X DELETE http://localhost:3000/user/1 \
  -H "x-api-key: secret-key-123" \
  -H "role: admin"
```

## Setup

```bash
pnpm install
```

## Run

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production build
pnpm run build
pnpm run start:prod
```

## Tests

```bash
pnpm run test
pnpm run test:e2e
pnpm run test:cov
```

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm run lint` | Lint with oxlint |
| `pnpm run format` | Format with Prettier |

## Resources

- [NestJS documentation](https://docs.nestjs.com)
- [Validation](https://docs.nestjs.com/techniques/validation)
- [Guards](https://docs.nestjs.com/guards)
- [Middleware](https://docs.nestjs.com/middleware)
- [Controllers & routing](https://docs.nestjs.com/controllers)

## Author

Arpit Vishwakarma

## License

Private learning project (`UNLICENSED`).
