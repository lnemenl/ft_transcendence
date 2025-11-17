/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Auth Service Unit Tests
  
 * The handleGoogleUser() function handles Google OAuth login flow:
 * 1. Exchanges auth code for tokens (getToken)
 * 2. Configures OAuth client with those tokens (setCredentials)
 * 3. Calls Google People API to get user profile
 * 4. Looks up user in database by googleId
 * 5. Returns existing user OR creates new one
 * 
 * COVERAGE:
 * - Test 1: getToken called with auth code ✓
 * - Test 2: setCredentials called with tokens ✓
 * - The Google API call and database logic are tested via route tests
 */

import { handleGoogleUser } from '../../src/services/auth.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('Auth Service: handleGoogleUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getToken with the provided auth code', async () => {
    const mockClient: any = {
      getToken: jest.fn(),
      setCredentials: jest.fn(),
    };
    mockClient.getToken.mockResolvedValue({ tokens: { access_token: 'fake' } });

    try {
      await handleGoogleUser('test-auth-code', mockClient);
    } catch (_error) {
      // Expected - we're not mocking the full Google API
    }

    expect(mockClient.getToken).toHaveBeenCalledWith('test-auth-code');
  });

  it('sets credentials after obtaining tokens', async () => {
    const mockClient: any = {
      getToken: jest.fn(),
      setCredentials: jest.fn(),
    };
    mockClient.getToken.mockResolvedValue({ tokens: { access_token: 'test-token', expires_in: 3600 } });

    try {
      await handleGoogleUser('test-code', mockClient);
    } catch (_error) {
      // Expected
    }

    expect(mockClient.setCredentials).toHaveBeenCalledWith({ access_token: 'test-token', expires_in: 3600 });
  });
});
