const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { app } = require('../index');

let server;
let baseUrl;
let aliceToken;
let bobToken;

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });
}

async function registerAndLogin(username) {
  const registration = await request('/register', {
    method: 'POST',
    body: JSON.stringify({ username, password: 'test-password' })
  });
  assert.equal(registration.status, 201);

  const login = await request('/customer/login', {
    method: 'POST',
    body: JSON.stringify({ username, password: 'test-password' })
  });
  assert.equal(login.status, 200);
  return (await login.json()).token;
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  aliceToken = await registerAndLogin('alice-test');
  bobToken = await registerAndLogin('bob-test');
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('public endpoints list and search the seeded books', async () => {
  const allBooks = await request('/');
  assert.equal(allBooks.status, 200);
  assert.equal(Object.keys(await allBooks.json()).length, 10);

  const byIsbn = await request('/isbn/1');
  assert.equal((await byIsbn.json()).title, 'Things Fall Apart');

  const byAuthor = await request('/author/jane%20austen');
  assert.equal((await byAuthor.json())[0].isbn, '8');

  const byTitle = await request('/title/pride');
  assert.equal((await byTitle.json())[0].title, 'Pride and Prejudice');
});

test('registration prevents duplicate users and reviews require authentication', async () => {
  const duplicate = await request('/register', {
    method: 'POST',
    body: JSON.stringify({ username: 'alice-test', password: 'another-password' })
  });
  assert.equal(duplicate.status, 409);

  const unauthorized = await request('/customer/auth/review/1', {
    method: 'PUT',
    body: JSON.stringify({ review: 'A thoughtful book' })
  });
  assert.equal(unauthorized.status, 401);
});

test('users can manage their own reviews but cannot delete another user review', async () => {
  const addReview = await request('/customer/auth/review/1', {
    method: 'PUT',
    headers: { authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ review: 'A thoughtful book' })
  });
  assert.equal(addReview.status, 200);
  assert.equal((await addReview.json()).reviews['alice-test'], 'A thoughtful book');

  const bobDelete = await request('/customer/auth/review/1', {
    method: 'DELETE',
    headers: { authorization: `Bearer ${bobToken}` }
  });
  assert.equal(bobDelete.status, 404);

  const aliceDelete = await request('/customer/auth/review/1', {
    method: 'DELETE',
    headers: { authorization: `Bearer ${aliceToken}` }
  });
  assert.equal(aliceDelete.status, 200);
  assert.deepEqual((await aliceDelete.json()).reviews, {});
});
