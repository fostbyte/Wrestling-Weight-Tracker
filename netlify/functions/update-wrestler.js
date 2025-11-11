// netlify/functions/wrestlers/update-wrestler.js
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
    const { id, firstName, lastName, weightClass, sex } = JSON.parse(event.body || "{}");
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing wrestler id" }) };
    }

    const updates = [];
    const params = [];
    let idx = 1;
    if (firstName !== undefined) { updates.push(`first_name = $${idx++}`); params.push(firstName); }
    if (lastName !== undefined) { updates.push(`last_name = $${idx++}`); params.push(lastName); }
    if (weightClass !== undefined) { updates.push(`weight_class = $${idx++}`); params.push(weightClass); }
    if (sex !== undefined) { updates.push(`sex = $${idx++}`); params.push(sex); }

    if (updates.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No fields to update" }) };
    }

    const client = getClient();
    await client.connect();

    const q = `UPDATE wrestlers SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, first_name, last_name, weight_class, sex`;
    params.push(id);
    const res = await client.query(q, params);
    await client.end();

    const r = res.rows[0];
    return { statusCode: 200, body: JSON.stringify({ success: true, wrestler: { id: r.id, firstName: r.first_name, lastName: r.last_name, weightClass: r.weight_class, sex: r.sex } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
}
