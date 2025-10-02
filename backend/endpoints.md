## Endpoints for the backend


### Registering a new user
`/api/register`

**This endpoint requires a body that looks like the following:**
```
{
  email: string
  password: string
}
```

**Responses:**
- On success the server responds by sending the registered user back in **JSON format**
- On failure the server responds with an appropriate error message in **JSON format** and returns **status code 400**