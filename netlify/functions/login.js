// netlify/functions/auth/login.js
import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const getClient = () => new Client({
  connectionString: process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    // console.log("event.body", event.body);
    const { login_code, password_hash } = JSON.parse(event.body || "{}");
    // console.log("login_code", login_code);
    // console.log("password_hash", password_hash);
    if (!login_code || !password_hash) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing login_code or password_hash" }) };
    }

    const client = getClient();
    await client.connect();

    const res = await client.query(
      `SELECT id, login_code, name, password_hash, primary_color, secondary_color
       FROM schools
       WHERE login_code = $1
       LIMIT 1`,
      [login_code]
    );
    // console.log("res", res);
    await client.end();

    if (!res.rows.length) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials1" }) };
    }

    const school = res.rows[0];
  
    const match = await bcrypt.compare(password_hash, school.password_hash);
    console.log("password_hash", password_hash);
    console.log("school.password_hash", school.password_hash);
    console.log("match", match);
    if (!match) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials2" }) };
    }

    const token = jwt.sign(
      { school_id: school.id, login_code: school.login_code },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        school: {
          id: school.id,
          login_code: school.login_code,
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
