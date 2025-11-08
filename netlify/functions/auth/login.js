// netlify/functions/auth/login.js
import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const getClient = () => new Client({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(event) {
  try {
    const { code, password } = JSON.parse(event.body || "{}");
    if (!code || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing code or password" }) };
    }

    const client = getClient();
    await client.connect();

    const res = await client.query(
      `SELECT id, code, name, password_hash, primary_color, secondary_color FROM schools WHERE code = $1 LIMIT 1`,
      [code]
    );

    await client.end();

    if (!res.rows.length) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const school = res.rows[0];
    const match = await bcrypt.compare(password, school.password_hash);
    if (!match) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const token = jwt.sign(
      { school_id: school.id, code: school.code },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        school: {
          id: school.id,
          code: school.code,
          name: school.name,
          primary_color: school.primary_color,
          secondary_color: school.secondary_color
        }
      })
    };

  } catch (err) {
    console.error("login error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
