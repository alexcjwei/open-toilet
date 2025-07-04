import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.join(__dirname, '../database.sqlite');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = () => {
  // Create restrooms table
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS restrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('male', 'female', 'neutral')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create access codes table
    db.run(`
      CREATE TABLE IF NOT EXISTS access_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restroom_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        dislikes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restroom_id) REFERENCES restrooms (id) ON DELETE CASCADE,
        UNIQUE(restroom_id, code)
      )
    `);

    if (process.env.NODE_ENV !== 'test') {
      console.log('Database initialized successfully');
    }
  });
};

export const closeDatabase = () => {
  db.close();
};