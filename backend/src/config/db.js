import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// สร้าง config object พื้นฐาน
const poolConfig = {
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

// เพิ่มคอนฟิก SSL เฉพาะเมื่อมีการเปิดใช้งาน (รองรับทั้งการแปลงเป็น Boolean หรือเช็ก String "true")
const isSSLEnabled = env.DATABASE_SSL === true || String(env.DATABASE_SSL).toLowerCase() === 'true';

if (isSSLEnabled) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// สร้าง Pool จาก config ที่จัดเตรียมไว้
export const pool = new Pool(poolConfig);

// ดักจับ Error ที่อาจเกิดขึ้นใน Background (เช่น Network หลุดระหว่างที่ Connection ค้างอยู่ใน Pool)
pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

// ฟังก์ชันตรวจสอบการเชื่อมต่อ
export async function verifyDatabaseConnection() {
  let client;
  try {
    // แนะนำให้ใช้ pool.connect() เพื่อทดสอบการดึง Client ออกมาจาก Pool จริงๆ
    client = await pool.connect();
    const result = await client.query('SELECT NOW() AS now');
    return result.rows.now; // จะคืนค่ากลับไปเป็น Object Date ของ JavaScript
  } catch (error) {
    throw error; // ส่งต่อ Error ให้ server.js จัดการในบล็อก try-catch
  } finally {
    if (client) client.release(); // คืน Client กลับเข้า Pool เสมอ
  }
}
