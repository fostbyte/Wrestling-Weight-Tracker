import { Client } from "pg";
import bcrypt from "bcryptjs";

export default async function handler(event) {
  const { token, name, login_code, password } = JSON.parse(event.body);

  if (token !== "MASTER_ADMIN") {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const hashed = await bcrypt.hash(password, 10);
  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(
      `INSERT INTO schools (name, login_code, password_hash)
       VALUES ($1, $2, $3)`,
      [name, login_code, hashed]
    );
    return { statusCode: 200, body: "School created" };
  } finally {
    await client.end();
  }
}
