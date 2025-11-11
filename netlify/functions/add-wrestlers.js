// netlify/functions/wrestlers/add-wrestler.js
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
    const payload = verifyToken(event);
    const schoolId = payload.school_id;
    const { firstName, lastName, weightClass, sex } = JSON.parse(event.body || "{}");

    if (!firstName || !lastName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
    }

    const client = getClient();
    await client.connect();

    const insertRes = await client.query(
      `INSERT INTO wrestlers (school_id, first_name, last_name, weight_class, sex) VALUES ($1,$2,$3,$4,$5) RETURNING id, first_name, last_name`,
      [schoolId, firstName, lastName, weightClass || 0, sex]
    );

    await client.end();

    const r = insertRes.rows[0];
    return { statusCode: 200, body: JSON.stringify({ success: true, wrestler: { id: r.id, firstName: r.first_name, lastName: r.last_name } }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
}
