export const testUsers = {
  alice: {
    email: 'alice@example.com',
    password: 'SecurePass123!',
    username: 'alice',
  },
  anna: {
    email: 'anna@example.com',
    password: 'SecurePass123!',
    username: 'anna',
  },
  bob: {
    email: 'bob@example.com',
    password: 'SecurePass456!',
    username: 'bob',
  },
  charlie: {
    email: 'charlie@example.com',
    password: 'SecurePass789!',
    username: 'charlie',
  },
};

// Invalid test data for validation tests
export const invalidUsers = {
  noPassword: {
    email: 'test@example.com',
    username: 'test',
    // password missing
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'ValidPass123!',
    username: 'validuser',
  },
  shortPassword: {
    email: 'test@example.com',
    password: '123',
    username: 'test',
  },
  longEmail: {
    email: 'not-an-email-at-all-lol@not-a-valid-email.not',
    password: 'ValidPass123!',
    username: 'validuser',
  },
   longPassword: {
    email: 'test@example.com',
    password: '123thisisaveryveryveryveryveryveryveryveryveryverylongpassword',
    username: 'test',
  },
  shortUsername: {
    email: 'test@example.com',
    password: 'ValidPass123!',
    username: 'a',
  },
  longUsername: {
    email: 'test@example.com',
    password: 'ValidPass123!',
    username: 'abcdefghijklmnopqrstuvwxyz',
  },
};
