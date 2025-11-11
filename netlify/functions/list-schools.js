import { Client } from "pg";

export async function handler(event) {
  try {
    const { token } = JSON.parse(event.body || "{}");

    if (token !== "MASTER_ADMIN") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const client = new Client({
      connectionString: process.env.NETLIFY_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const res = await client.query(
      `SELECT id, name, login_code, primary_color, secondary_color FROM schools ORDER BY name ASC`
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(res.rows)
    };
  } catch (err) {
    console.error("list-schools error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
