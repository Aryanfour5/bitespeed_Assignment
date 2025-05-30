const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://aryan:KlHbQt1hCvWzRB7SnOjdonBaAu5SQkcm@dpg-d0srt2buibrs73ao4dag-a.oregon-postgres.render.com/bitespeed_yxy7',
  ssl: {
    rejectUnauthorized: false,
  },
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS "Contact" (
    id SERIAL PRIMARY KEY,
    "phoneNumber" VARCHAR(255),
    email VARCHAR(255),
    "linkedId" INTEGER,
    "linkPrecedence" VARCHAR(10) NOT NULL CHECK ("linkPrecedence" IN ('primary', 'secondary')),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP,
    FOREIGN KEY ("linkedId") REFERENCES "Contact"(id)
  );
`;

async function createContactTable() {
  try {
    await client.connect();
    console.log("Connected to DB");

    await client.query(createTableQuery);
    console.log("Contact table created successfully");

    await client.end();
  } catch (err) {
    console.error("Error creating table:", err);
  }
}

createContactTable();
