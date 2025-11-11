// netlify/functions/schools/update-school-settings.js
import { Client } from "pg";
import bcrypt from "bcryptjs";
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
    const payload = verifyToken(event);
    const schoolId = payload.school_id;
    const { name, password, primary_color, secondary_color } = JSON.parse(event.body || "{}");

    const client = getClient();
    await client.connect();

    const updates = [];
    const params = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); params.push(name); }
    if (primary_color !== undefined) { updates.push(`primary_color = $${idx++}`); params.push(primary_color); }
    if (secondary_color !== undefined) { updates.push(`secondary_color = $${idx++}`); params.push(secondary_color); }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${idx++}`);
      params.push(hash);
    }

    if (updates.length === 0) {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ error: "No updates provided" }) };
    }

    const q = `UPDATE schools SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, name, primary_color, secondary_color`;
    params.push(schoolId);

    const res = await client.query(q, params);
    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true, school: res.rows[0] }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
}
