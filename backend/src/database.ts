import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.join(__dirname, '../database.sqlite');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = () => {
  db.serialize(() => {
    // Create locations table
    db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create restrooms table (now references locations)
    db.run(`
      CREATE TABLE IF NOT EXISTS restrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('male', 'female', 'neutral')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
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

    // Migration: Check if old schema exists and migrate data
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='restrooms'`, (err, row: any) => {
      if (err) return;
      
      if (row) {
        // Check if restrooms table has old schema (has latitude/longitude columns)
        db.all(`PRAGMA table_info(restrooms)`, (err, columns: any[]) => {
          if (err) return;
          
          const hasLatitude = columns.some(col => col.name === 'latitude');
          const hasLocationId = columns.some(col => col.name === 'location_id');
          
          if (hasLatitude && !hasLocationId) {
            // Need to migrate from old schema
            console.log('Migrating database to new schema...');
            
            // Rename old table
            db.run(`ALTER TABLE restrooms RENAME TO restrooms_old`);
            
            // Create new tables with correct schema
            db.run(`
              CREATE TABLE restrooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('male', 'female', 'neutral')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
              )
            `);
            
            // Migrate data: create locations from old restrooms and link them
            db.run(`
              INSERT INTO locations (name, latitude, longitude, created_at)
              SELECT DISTINCT name, latitude, longitude, MIN(created_at)
              FROM restrooms_old
              GROUP BY latitude, longitude
            `);
            
            // Migrate restrooms with location references
            db.run(`
              INSERT INTO restrooms (location_id, name, type, created_at)
              SELECT l.id, r.name, r.type, r.created_at
              FROM restrooms_old r
              JOIN locations l ON l.latitude = r.latitude AND l.longitude = r.longitude
            `);
            
            // Update access_codes foreign keys (they should still work as restroom IDs are preserved)
            
            // Drop old table
            db.run(`DROP TABLE restrooms_old`);
            
            console.log('Database migration completed');
          }
        });
      }
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log('Database initialized successfully');
    }
  });
};

export const closeDatabase = () => {
  db.close();
};