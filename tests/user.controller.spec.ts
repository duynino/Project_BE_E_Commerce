import assert from 'node:assert/strict';
import { UserController } from '../src/controllers/user.controller';

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response;
};

const testCreateUserMergesUploadedAvatar = async () => {
  let receivedPayload: any;
  const controller = new UserController({
    async createUser(payload: any) {
      receivedPayload = payload;
      return { id: 'user-1', ...payload };
    },
  } as any);

  const req = {
    body: { email: 'user@example.com', password: 'secret123' },
    uploadedFile: { url: 'https://cdn.example.com/avatar.jpg' },
  } as any;
  const res = createResponse() as any;

  await controller.createUser(req, res);

  assert.deepEqual(receivedPayload, {
    email: 'user@example.com',
    password: 'secret123',
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
  });
  assert.equal(res.statusCode, 201);
};

const testUpdateUserMergesUploadedAvatar = async () => {
  let receivedPayload: any;
  const controller = new UserController({
    async updateUser(_id: string, payload: any) {
      receivedPayload = payload;
      return { id: 'user-1', ...payload };
    },
  } as any);

  const req = {
    params: { id: 'user-1' },
    body: { firstName: 'Alice' },
    uploadedFile: { url: 'https://cdn.example.com/avatar-2.jpg' },
  } as any;
  const res = createResponse() as any;

  await controller.updateUser(req, res);

  assert.deepEqual(receivedPayload, {
    firstName: 'Alice',
    avatarUrl: 'https://cdn.example.com/avatar-2.jpg',
  });
  assert.equal(res.statusCode, 200);
};

await testCreateUserMergesUploadedAvatar();
await testUpdateUserMergesUploadedAvatar();
console.log('user.controller.spec passed');
