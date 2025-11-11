import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function handler(event) {
  console.log(event.body);
  const { token, name, login_code, password } = JSON.parse(event.body || "{}");

  if (token !== "MASTER_ADMIN") {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const hashed = await bcrypt.hash(password, 10);
  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log(client);
    await client.query(
      `INSERT INTO schools (name, login_code, password_hash)
       VALUES ($1, $2, $3)`,
      [name, login_code, hashed]
    );
    return { statusCode: 200, body: JSON.stringify({ success: true, message: "School created" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    await client.end();
  }
}
