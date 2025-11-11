// netlify/functions/wrestlers/get-wrestlers.js
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

    const client = getClient();
    await client.connect();

    const res = await client.query(
      `SELECT id, first_name, last_name, weight_class, sex FROM wrestlers WHERE school_id = $1 ORDER BY last_name, first_name`,
      [schoolId]
    );

    await client.end();

    const wrestlers = res.rows.map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      name: `${r.first_name} ${r.last_name}`,
      weightClass: r.weight_class,
      sex: r.sex
    }));

    return { statusCode: 200, body: JSON.stringify({ wrestlers }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
}
