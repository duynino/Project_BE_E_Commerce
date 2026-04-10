# User RUD API Design

## Scope

Implement read, update, and delete APIs for the existing `User` model. Do not add a create user endpoint; user creation remains part of the existing auth/register flow.

## Architecture

Follow the existing Role and Permission module structure:

- `src/routes/user.router.ts` wires routes, authentication, permissions, and controller calls.
- `src/controllers/user.controller.ts` handles Express request and response formatting.
- `src/services/user.service.ts` contains TypeORM data access and business rules.

No shared CRUD base controller/service will be introduced for this task.

## Endpoints

All endpoints are mounted under `/api/users` and require `authenticate`.

- `GET /get-all` requires `PERMISSION.VIEW_USERS`.
- `GET /:id` requires `PERMISSION.VIEW_USER`.
- `PUT /:id` requires `PERMISSION.UPDATE_USER`.
- `DELETE /:id` requires `PERMISSION.DELETE_USER`.

## Read Behavior

`GET /get-all` returns users with pagination metadata. It supports query parameters consistent with the Role module:

- `page`, default `1`
- `pageSize`, default `process.env.LIMIT_PAGE` or `10`
- `sortBy`, default `id`
- `order`, default `ASC`
- `search`, matched against user profile fields

Search should match `email`, `firstName`, or `lastName`.

`GET /:id` returns a single user by UUID or returns a bad request response with a clear "User not found" message if the user does not exist.

## Update Behavior

`PUT /:id` updates profile fields only:

- `firstName`
- `lastName`
- `gender`
- `age`
- `phoneNumber`
- `dateOfBirth`
- `address`
- `avatarUrl`

The endpoint must not update `email`, `password`, `isVerified`, `refreshToken`, `googleId`, or role relationships.

## Delete Behavior

`DELETE /:id` performs a hard delete, matching the current Role and Permission delete style. If the user is not found, return a bad request response with a clear "User not found" message.

## Response Format

Keep the current project response shape:

- Success: `{ status, message, data }`
- List success: `{ status, message, data, pagination }`
- Failure: `{ status, message }`

## Testing And Verification

Add focused tests for `UserService` behavior before implementation:

- get all users returns data and pagination
- get user by id throws when missing
- update user only applies allowed profile fields
- delete user removes an existing user

Run the available build/lint verification after implementation. If the project test script is not configured, use a targeted temporary or project-local TypeScript test command and report that limitation.
