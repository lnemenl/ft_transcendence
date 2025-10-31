export const testUsers = {
  alice: {
    email: 'alice@example.com',
    password: 'SecurePass123!',
    username: 'alice',
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
  shortUsername: {
    email: 'test@example.com',
    password: 'ValidPass123!',
    username: 'a',
  },
};
