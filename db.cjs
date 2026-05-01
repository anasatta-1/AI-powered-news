require('dotenv').config();
const mysql = require('mysql2/promise');

// Create a connection pool for the new geopolitical_tracker database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASS || '', 
  database: process.env.DB_NAME || 'geopolitical_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function getActiveEvents() {
  const [rows] = await pool.query(`
    SELECT e.*, 
           GROUP_CONCAT(CONCAT(c.name, ' (', ec.involvement_type, ')') SEPARATOR ', ') as involved_parties
    FROM events e
    LEFT JOIN event_countries ec ON e.id = ec.event_id
    LEFT JOIN countries c ON ec.country_iso = c.iso_code
    WHERE e.status = 'Active'
    GROUP BY e.id
    ORDER BY e.severity DESC, e.date_occurred DESC
  `);
  return rows;
}

async function getActiveCountries() {
  const [rows] = await pool.query(`
    SELECT DISTINCT c.name 
    FROM event_countries ec
    JOIN events e ON ec.event_id = e.id
    JOIN countries c ON ec.country_iso = c.iso_code
    WHERE e.status = 'Active'
  `);
  return rows.map(r => r.name);
}

// NEW: Add a manual or automatic event
async function addEvent(eventData) {
  const { title, title_ar, description, event_type, severity, latitude, longitude, countries } = eventData;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Insert the event
    const [result] = await connection.query(
      `INSERT INTO events (title, title_ar, description, event_type, severity, latitude, longitude, date_occurred) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, title_ar, description, event_type, severity, latitude, longitude]
    );
    const eventId = result.insertId;

    // 2. Link countries if provided
    if (countries && countries.length > 0) {
      for (const country of countries) {
        await connection.query(
          `INSERT INTO event_countries (event_id, country_iso, involvement_type) VALUES (?, ?, ?)`,
          [eventId, country.iso, country.role || 'Primary']
        );
      }
    }

    await connection.commit();
    return eventId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getCountryProfile(isoCode) {
  const [countries] = await pool.query('SELECT * FROM countries WHERE iso_code = ?', [isoCode]);
  if (countries.length === 0) return null;
  const country = countries[0];
  const [events] = await pool.query(`
    SELECT e.*, ec.involvement_type 
    FROM events e
    JOIN event_countries ec ON e.id = ec.event_id
    WHERE ec.country_iso = ?
  `, [isoCode]);
  country.involved_events = events;
  return country;
}

module.exports = {
  pool,
  getActiveEvents,
  getActiveCountries,
  addEvent,
  getCountryProfile
};
