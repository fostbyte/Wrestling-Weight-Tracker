import { Client } from "pg";

export default async function handler(event) {
  const { token, school_id } = JSON.parse(event.body);

  if (token !== "MASTER_ADMIN") {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(`DELETE FROM weights WHERE wrestler_id IN (SELECT id FROM wrestlers WHERE school_id=$1)`, [school_id]);
    await client.query(`DELETE FROM wrestlers WHERE school_id=$1`, [school_id]);
    await client.query(`DELETE FROM schools WHERE id=$1`, [school_id]);

    return { statusCode: 200, body: "School deleted" };
  } finally {
    await client.end();
  }
}
