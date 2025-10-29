/* istanbul ignore next */
export const getAccessTokenExpiresIn = (): string => process.env.JWT_ACCESS_EXPIRES_IN || '15m';

/* istanbul ignore next */
export const getSecureCookies = (): boolean => process.env.NODE_ENV === 'production';

// A typescript arrow function, that is returning a type of string or boolean depending on the case.
// Good for the testing part, as the value is read when the function is CALLED, instead of assigning...
// ...value to the export const variable like "export const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';"
