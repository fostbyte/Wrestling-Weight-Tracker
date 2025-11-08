// netlify/functions/weights/get-weight-history.js
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
    const wrestlerName = (event.queryStringParameters && event.queryStringParameters.wrestler) || "";

    const client = getClient();
    await client.connect();

    // join weights -> wrestlers filtered by school_id and optional name search
    const q = `
      SELECT wt.id, wt.date, wt.weight, wt.type,
             w.id as wrestler_id, w.first_name, w.last_name
      FROM weights wt
      JOIN wrestlers w ON wt.wrestler_id = w.id
      WHERE w.school_id = $1
      ${wrestlerName ? ` AND (CONCAT(w.first_name,' ',w.last_name) ILIKE $2)` : ""}
      ORDER BY wt.date ASC
    `;

    const params = wrestlerName ? [schoolId, `%${wrestlerName}%`] : [schoolId];
    const res = await client.query(q, params);
    await client.end();

    const weights = res.rows.map(r => ({
      id: r.id,
      wrestlerId: r.wrestler_id,
      name: `${r.first_name} ${r.last_name}`,
      date: r.date,
      weight: parseFloat(r.weight),
      type: r.type
    }));

    return { statusCode: 200, body: JSON.stringify({ weights }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
}
