import { db, initializeDatabase } from '../database';

// Initialize database and clean up before each test
beforeEach((done) => {
  // Initialize database first
  initializeDatabase();
  
  // Then clean up any existing data
  db.serialize(() => {
    db.run('DELETE FROM access_codes');
    db.run('DELETE FROM restrooms', () => {
      done();
    });
  });
});