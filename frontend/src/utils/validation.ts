// Validation utility functions matching backend schema requirements

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Reasonable max lengths for production use
const MAX_USERNAME_LENGTH = 15;
const MAX_EMAIL_LENGTH = 30;

// Email validation using HTML5 email pattern
export function validateEmail(email: string): ValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim().length === 0) {
    return { isValid: true }; // Empty is valid for optional fields
  }
  
  if (email.trim().length > MAX_EMAIL_LENGTH) {
    return { isValid: false, error: 'emailTooLong' };
  }
  
  if (!emailPattern.test(email.trim())) {
    return { isValid: false, error: 'emailInvalid' };
  }
  
  return { isValid: true };
}

// Username validation: minimum 2 characters, maximum 15, alphanumeric + underscore + hyphen
export function validateUsername(username: string): ValidationResult {
  const trimmed = username.trim();
  
  if (trimmed.length === 0) {
    return { isValid: true }; // Empty is valid for optional fields
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'usernameTooShort' };
  }
  
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return { isValid: false, error: 'usernameTooLong' };
  }
  
  // Allow letters, numbers, underscores, and hyphens
  const usernamePattern = /^[a-zA-Z0-9_-]+$/;
  if (!usernamePattern.test(trimmed)) {
    return { isValid: false, error: 'usernameInvalid' };
  }
  
  return { isValid: true };
}

// Password validation: minimum 8 characters
export function validatePassword(password: string): ValidationResult {
  if (password.length === 0) {
    return { isValid: true }; // Empty is valid until form submission
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'passwordTooShort' };
  }
  
  return { isValid: true };
}
