# Express.js vs NestJS

If you already know Express, NestJS can feel like “Express with opinions.” Both run on Node.js and can use Express under the hood, but NestJS adds a structured architecture, decorators, and built-in patterns so teams can scale applications more predictably.

This guide maps your rough notes to accurate concepts, with examples you can reuse for revision and interviews.

---

## Comparison at a Glance

| Concept | Express.js | NestJS |
|---|---|---|
| Routing | Routes and route handlers | Controllers and decorators (`@Controller`, `@Get`, `@Post`, …) |
| Business logic | Functions or service classes organized by the developer | Providers and services (`@Injectable()`) |
| Application structure | Developer-defined folders and modules | NestJS **modules** (`@Module`) that declare controllers and providers |
| Request validation | Middleware or validation libraries (e.g. Joi, Zod, express-validator) | **Pipes**, commonly with `class-validator` and `class-transformer` |
| Authentication and authorization | Middleware and custom authorization logic | **Guards**, often combined with Passport or custom strategies |
| Dependency management | Usually manual imports or a third-party DI library | Built-in **dependency injection** (constructor injection) |
| Request handling | Middleware chain + route handlers | Controllers, plus pipes, guards, interceptors, filters, and middleware |

---

## 1. Routes vs Controllers

### What it means

**Routing** is how your server maps an HTTP method and URL path to code that runs for that request.

### How Express handles it

You register routes on an `app` or `Router` instance. Each route associates a path and HTTP verb with a handler function.

### How NestJS handles it

A **controller** is a class decorated with `@Controller('path')`. Each endpoint is a method decorated with `@Get()`, `@Post()`, etc. NestJS registers these routes when the application boots.

### Why NestJS uses this approach

- Endpoints are grouped in one class per feature area (e.g. users).
- Decorators make HTTP details visible at a glance.
- Controllers stay thin: they delegate work to services instead of growing into large handler files.

### Code example

**Express**

```javascript
const express = require('express');
const app = express();

app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/users', (req, res) => {
  res.status(201).json({ message: 'User created' });
});
```

**NestJS**

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return { users: [] };
  }

  @Post()
  create(@Body() body: { name: string; email: string }) {
    return { message: 'User created' };
  }
}
```

### Key takeaway

Express **route handlers** are functions you wire manually; NestJS **controller methods** are class methods discovered and wired by the framework via decorators.

---

## 2. Business Logic vs Providers and Services

### What it means

**Business logic** is the rules of your application: creating a user, calculating a price, checking permissions—not low-level HTTP details like reading headers.

### How Express handles it

You might put logic inline in route handlers (fine for tiny apps) or extract it into separate functions or classes (`userService.js`) and `require` them where needed.

### How NestJS handles it

Logic lives in **providers**. A **service** is the most common kind of provider: a class marked `@Injectable()` that NestJS can inject wherever it is listed in a module’s `providers` array.

### Why NestJS uses this approach

- Logic is testable without mocking `req`/`res`.
- The same service can be injected into multiple controllers or other services.
- Clear separation: controllers adapt HTTP; services implement domain behavior.

### Code example

**Express**

```javascript
function createUserInStore({ name, email }) {
  return { id: 1, name, email };
}

app.post('/users', (req, res) => {
  const user = createUserInStore(req.body);
  res.status(201).json(user);
});
```

**NestJS**

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  create(name: string, email: string) {
    return { id: 1, name, email };
  }
}
```

### Key takeaway

In both stacks, keep HTTP at the edges and business rules in dedicated code; NestJS enforces that pattern with injectable services.

---

## 3. Application Structure vs Modules

### What it means

**Application structure** is how you split code into files and how those pieces depend on each other.

### How Express handles it

You choose folders (`routes/`, `services/`, `middleware/`) and connect them with `require`/`import`. There is no single enforced pattern.

### How NestJS handles it

A **module** (`@Module`) is a cohesive unit: it lists **controllers**, **providers**, and optionally **imports** other modules. The root `AppModule` composes the app.

### Why NestJS uses this approach

- Features are encapsulated (`UsersModule`, `AuthModule`).
- Dependencies are explicit in module metadata.
- Lazy loading and testing are easier when boundaries are clear.

### Code example

**Express (typical layout)**

```
src/
  routes/users.js      → wires paths to handlers
  services/user.js     → business logic
  app.js               → mounts routes, middleware
```

**NestJS**

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

### Key takeaway

Express structure is **your convention**; NestJS structure is **module declarations** that the framework uses to build the dependency graph.

---

## 4. Request Validation vs Pipes

### What it means

**Request validation** checks that incoming data (body, query, params) matches what your API expects before you run business logic.

### How Express handles it

You validate inside handlers or use middleware/libraries (e.g. `express-validator`, Joi, Zod) and return `400` when data is invalid.

### How NestJS handles it

A **pipe** is a class that transforms or validates data **before** it reaches the route handler. `ValidationPipe` uses **DTOs** (Data Transfer Objects)—classes with `class-validator` decorators—to define and enforce shape and rules.

Pipes are **not only for validation**: they can also **transform** values (e.g. string query param → number).

### Why NestJS uses this approach

- Validation rules live next to the type definition (the DTO).
- Global or per-route pipes avoid repeating boilerplate in every controller.
- Invalid requests fail early with consistent error responses.

### What a pipe is

A pipe implements `PipeTransform`. It receives the value (and metadata about where it came from, e.g. `@Body()`) and returns the transformed value or throws an exception.

### When NestJS runs pipes

For a given route, pipes run on parameters (body, query, param, custom decorators) **after** guards and **before** the controller method runs (see [Request lifecycle](#nestjs-http-request-lifecycle-simplified) below).

### How `ValidationPipe` works

1. Incoming JSON is matched to a DTO class (when `transform: true`, plain objects can become class instances).
2. `class-validator` runs decorators on each property.
3. If validation fails, NestJS throws `BadRequestException` with details (by default).
4. If validation passes, the controller receives the validated (and optionally transformed) object.

### DTOs and `class-validator`

A DTO is a class that describes the expected request shape. Decorators such as `@IsEmail()` declare constraints.

```typescript
// create-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;
}
```

### `whitelist` and `transform`

Register globally in `main.ts`:

```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}
```

| Option | Purpose |
|---|---|
| `whitelist: true` | Strips properties that are **not** decorated on the DTO (reduces mass-assignment risk). |
| `transform: true` | Converts payloads to DTO class instances and enables type conversion where configured (e.g. `@Type(() => Number)` for query params). |

Validation only works if `class-validator` and `class-transformer` are installed and reflect-metadata is enabled (NestJS projects include this by default). Controllers must type parameters with the DTO class (e.g. `@Body() dto: CreateUserDto`).

### What happens when validation fails

NestJS responds with **400 Bad Request** and a body describing constraint violations (unless you customize the exception filter).

### Key takeaway

Express validation is usually **middleware or manual checks**; NestJS validation is often **pipe + DTO decorators**, with optional transformation in the same step.

---

## 5. Authentication Middleware vs Guards

### What it means

**Authentication** verifies who the caller is; **authorization** verifies whether they may perform an action.

### How Express handles it

**Middleware** runs in order. Auth middleware might read a JWT from a header, attach `req.user`, and call `next()` or send `401`/`403`. The same middleware mechanism also handles logging, CORS, body parsing, etc.

### How NestJS handles it

A **guard** implements `CanActivate`. It returns `true` to allow the request to proceed to the handler (and subsequent pipes), or `false`/throws to block it. Guards are the idiomatic place for **authn/authz** at the route level.

**Guards are not a drop-in replacement for all Express middleware.**

| Mechanism | Typical use in NestJS |
|---|---|
| Middleware | Logging, cookies, raw request tweaking, legacy Express middleware |
| Guards | “Is this user allowed to hit this handler?” (JWT, roles, policies) |
| Pipes | Validation and transformation of inputs |
| Interceptors | Transform responses, logging, caching around handler execution |

Guards can use NestJS **execution context** (`ExecutionContext`) to inspect the controller class and handler method (e.g. read `@Roles()` metadata). Express middleware only sees `req`, `res`, `next` unless you attach custom data yourself.

### Code example (conceptual)

**Express auth middleware**

```javascript
function authMiddleware(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  req.user = verifyToken(token);
  next();
}

app.get('/profile', authMiddleware, (req, res) => {
  res.json(req.user);
});
```

**NestJS guard (simplified)**

```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    if (!token) throw new UnauthorizedException();
    request.user = verifyToken(token);
    return true;
  }
}
```

Apply with `@UseGuards(AuthGuard)` on a controller or method.

### Key takeaway

Express **middleware** is a general pipeline tool; NestJS **guards** are specialized for access control, while other concerns use middleware, pipes, or interceptors.

---

## 6. Manual Dependency Management vs Dependency Injection

### What it means

**Dependency management** is how one piece of code gets references to another (database client, user service, config).

### How Express handles it

Common pattern: create instances at startup and pass them into routers, or import singleton modules. You wire everything yourself.

```javascript
const userService = new UserService();
const userRouter = createUserRouter(userService);
app.use('/users', userRouter);
```

### How NestJS handles it

**Dependency injection (DI)** is built in. You declare dependencies in constructors; NestJS creates instances and injects them based on module `providers` and `imports`.

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
```

### Why NestJS uses this approach

- Less boilerplate wiring in `main` or route files.
- Easier unit tests (swap real services for mocks in the testing module).
- Single place (module) to see what a feature needs.

### Key takeaway

Express favors **explicit wiring**; NestJS favors **constructor injection** configured through modules.

---

## Correcting: “Providers handle request and response”

Your original note said providers handle requests and responses. **That is not how NestJS is designed.**

| Layer | Responsibility |
|---|---|
| **Controller** | Defines HTTP routes; receives the request context via decorators (`@Body()`, `@Param()`, …); returns a value (or throws). NestJS serializes the return value into the HTTP response. |
| **Provider / Service** | Holds **business logic**, data access, or reusable operations. It does **not** normally touch `req`/`res` directly. |
| **Framework** | Maps HTTP to controller methods and builds responses from return values and status decorators. |

Flow: **Request → (middleware → guards → interceptors → pipes) → Controller → Service → return value → response.**

### Side-by-side: create user

**Express**

```javascript
const express = require('express');
const app = express();
app.use(express.json());

function createUserLogic({ name, email }) {
  return { id: Date.now(), name, email };
}

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Invalid input' });
  }
  const user = createUserLogic({ name, email });
  res.status(201).json(user);
});
```

**NestJS**

```typescript
// users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto.name, createUserDto.email);
  }
}

// users.service.ts
@Injectable()
export class UsersService {
  create(name: string, email: string) {
    return { id: Date.now(), name, email };
  }
}
```

The controller **adapts HTTP**; the service **implements the rule** “create a user object.”

---

## Complete Mini Example: `POST /users`

Same behavior in both stacks: accept `name` and `email`, validate, run logic in a service layer, return JSON.

### Express

```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

function createUser({ name, email }) {
  return {
    message: 'User created successfully',
    data: { id: 1, name, email },
  };
}

const validateCreateUser = [
  body('name').isString().isLength({ min: 3 }),
  body('email').isEmail(),
];

app.post('/users', validateCreateUser, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const result = createUser(req.body);
  res.status(201).json(result);
});
```

### NestJS

**`create-user.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;
}
```

**`users.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  create(name: string, email: string) {
    return {
      message: 'User created successfully',
      data: { id: 1, name, email },
    };
  }
}
```

**`users.controller.ts`**

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(
      createUserDto.name,
      createUserDto.email,
    );
  }
}
```

**`users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

**`app.module.ts`** (import the feature module)

```typescript
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
})
export class AppModule {}
```

**`main.ts`** (global validation)

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen(3000);
}
void bootstrap();
```

---

## NestJS HTTP Request Lifecycle (Simplified)

This order helps you remember **where** each concept runs:

```text
Incoming Request
  → Middleware
  → Guards
  → Interceptors (before)
  → Pipes
  → Controller
  → Service / Provider
  → Interceptors (after)
  → HTTP Response
```

| Component | Responsibility |
|---|---|
| **Middleware** | Runs early; logging, mounting Express middleware, light request changes. |
| **Guards** | Allow or deny access to the route handler (authn/authz). |
| **Interceptors (before)** | Wrap handler execution; can mutate context or implement cross-cutting logic before the handler. |
| **Pipes** | Validate and transform route parameters, body, and query. |
| **Controller** | Entry point for the route; calls services; returns data. |
| **Service / Provider** | Business logic and shared operations. |
| **Interceptors (after)** | Transform the value returned from the handler (e.g. wrap in `{ data: ... }`). |

**Also in the full picture (not shown above):**

- **Exception filters** catch thrown errors and shape error HTTP responses.
- **Middleware** scope can be global, module-scoped, or route-scoped; guard and pipe order can be customized per route.

Use this diagram for mental revision, not as a substitute for the official execution order docs when you need edge-case precision.

---

## Express to NestJS: Quick Mapping

- Express route handler → NestJS **controller method**
- Business logic function/class → NestJS **service / provider**
- Developer-organized app layout → NestJS **modules**
- Validation middleware / library → NestJS **pipes** + **DTOs**
- Auth / authorization middleware → often NestJS **guards** (plus strategies for JWT, etc.)
- Manual dependency passing → NestJS **dependency injection**

---

## Things to Remember

1. **Controllers handle HTTP; services handle business logic**—providers do not replace controllers for request/response handling.
2. **Modules** declare which controllers and providers belong together and how features compose.
3. **Pipes** validate **and** transform input; pair them with DTOs and `ValidationPipe`.
4. **Guards** answer “may this request run?”—they are not the only tool middleware used to be; use middleware for cross-cutting non-auth tasks when appropriate.
5. **Dependency injection** removes manual wiring—declare dependencies in constructors and register providers in modules.

---

## Revision Questions

**1. In NestJS, which layer should parse and validate the JSON body for a `POST` request—a service or a pipe?**

<details>
<summary>Show answer</summary>

A **pipe** (typically `ValidationPipe` on a DTO) validates and transforms the body **before** it reaches the controller. The service receives already-validated data from the controller.
</details>

**2. Can a NestJS service access `req` and `res` directly in normal application code?**

<details>
<summary>Show answer</summary>

It **should not** in typical designs. Controllers (or custom decorators / request-scoped providers in advanced cases) bridge HTTP; services stay HTTP-agnostic for testability and clarity.
</details>

**3. What is the main difference between Express middleware and a NestJS guard?**

<details>
<summary>Show answer</summary>

Middleware is a **general** pipeline hook for many concerns (logging, parsing, auth). A guard is specialized for **whether the route handler may run** (authorization/authentication) and integrates with NestJS execution context and metadata.
</details>

**4. What do `whitelist: true` and `transform: true` do on `ValidationPipe`?**

<details>
<summary>Show answer</summary>

**whitelist** removes DTO properties that have no validation decorators. **transform** converts plain input into class instances and enables type transformation (e.g. query strings to numbers when configured).
</details>

**5. What three arrays in `@Module()` connect a feature’s HTTP surface to its logic?**

<details>
<summary>Show answer</summary>

**controllers** (HTTP endpoints), **providers** (services and other injectables), and **imports** (other modules whose exported providers you need). The root module composes feature modules.
</details>
