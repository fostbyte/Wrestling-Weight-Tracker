// netlify/functions/wrestlers/delete-wrestler.js
import { Client } from "pg";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const getClient = () => new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });

const verifyToken = (event) => {
  const header = event.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("No token");
  return jwt.verify(token, JWT_SECRET);
};

export async function handler(event) {
  try {
    verifyToken(event);
    const { id } = JSON.parse(event.body || "{}");
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing wrestler id" }) };
    }

    const client = getClient();
    await client.connect();

    // Delete weights first due to FK
    await client.query(`DELETE FROM weights WHERE wrestler_id = $1`, [id]);
    await client.query(`DELETE FROM wrestlers WHERE id = $1`, [id]);

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
}
