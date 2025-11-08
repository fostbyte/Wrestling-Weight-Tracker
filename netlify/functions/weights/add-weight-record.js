// netlify/functions/weights/add-weight-record.js
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

export default async function handler(event) {
  try {
    const payload = verifyToken(event);
    const schoolId = payload.school_id;
    const { date, firstName, lastName, weight, type } = JSON.parse(event.body || "{}");

    if (!firstName || !lastName || !weight) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
    }

    const client = getClient();
    await client.connect();

    // find wrestler in this school
    const wRes = await client.query(
      `SELECT id FROM wrestlers WHERE school_id = $1 AND first_name = $2 AND last_name = $3 LIMIT 1`,
      [schoolId, firstName, lastName]
    );

    if (!wRes.rows.length) {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ error: "Wrestler not found" }) };
    }

    const wrestlerId = wRes.rows[0].id;

    await client.query(
      `INSERT INTO weights (wrestler_id, date, weight, type) VALUES ($1,$2,$3,$4)`,
      [wrestlerId, date, weight, type]
    );

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
}
