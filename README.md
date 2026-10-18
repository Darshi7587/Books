# Online Book Review API

An Express REST API for the preloaded bookshop catalogue. Start it with `npm install` and `npm start`; it listens on port `5000` by default. Set `PORT`, `SESSION_SECRET`, and `JWT_SECRET` in deployment environments.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | List all books |
| `GET` | `/isbn/:isbn` | Find a book by its catalogue ISBN/key (`1`–`10`) |
| `GET` | `/author/:author` | Search author names (case-insensitive partial match) |
| `GET` | `/title/:title` | Search titles (case-insensitive partial match) |
| `GET` | `/review/:isbn` | Read a book's reviews |
| `POST` | `/register` | Register with `{"username":"...","password":"..."}` |
| `POST` | `/customer/login` | Login; returns a JWT and establishes a session |
| `PUT` | `/customer/auth/review/:isbn` | Add/update the logged-in user's review (`{"review":"..."}`) |
| `DELETE` | `/customer/auth/review/:isbn` | Delete only the logged-in user's review |

Protected review endpoints accept either the login session cookie or `Authorization: Bearer <token>`. User passwords are stored as salted scrypt hashes; books and reviews are held in memory and reset when the server restarts.

`general.js` exports four async Axios clients (`getAllBooks`, `getBookByISBN`, `getBooksByAuthor`, and `getBooksByTitle`). Set `BOOKS_API_URL` to override their default API origin.

## Example cURL commands

```sh
curl http://localhost:5000/
curl http://localhost:5000/isbn/1
curl http://localhost:5000/author/Jane%20Austen
curl http://localhost:5000/title/Pride
curl http://localhost:5000/review/1
curl -X POST http://localhost:5000/register -H "Content-Type: application/json" -d "{\"username\":\"reader1\",\"password\":\"secret\"}"
curl -X POST http://localhost:5000/customer/login -H "Content-Type: application/json" -d "{\"username\":\"reader1\",\"password\":\"secret\"}"
curl -X PUT http://localhost:5000/customer/auth/review/1 -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"review\":\"Excellent book\"}"
curl -X DELETE http://localhost:5000/customer/auth/review/1 -H "Authorization: Bearer <token>"
```

Run the API tests with `npm test`.
