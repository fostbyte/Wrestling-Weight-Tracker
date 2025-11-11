// netlify/functions/auth/verify.js
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

export async function handler(event) {
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: "No token" }) };
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { statusCode: 200, body: JSON.stringify({ valid: true, payload }) };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
  }
}
