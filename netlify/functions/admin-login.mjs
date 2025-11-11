export async function handler(event) {
  const { username, password } = JSON.parse(event.body || "{}");

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return {
      statusCode: 200,
      body: JSON.stringify({ token: "MASTER_ADMIN" })
    };
  }

  return {
    statusCode: 401,
    body: JSON.stringify({ error: "Invalid credentials" })
  };
}
