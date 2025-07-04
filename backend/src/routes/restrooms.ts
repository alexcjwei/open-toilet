import express from 'express';
import { db } from '../database';

const router = express.Router();

// Get all restrooms with their codes
router.get('/', (req, res) => {
  const query = `
    SELECT 
      r.id,
      r.name,
      r.latitude,
      r.longitude,
      r.type,
      r.created_at,
      JSON_GROUP_ARRAY(
        JSON_OBJECT(
          'id', ac.id,
          'code', ac.code,
          'likes', ac.likes,
          'dislikes', ac.dislikes,
          'created_at', ac.created_at
        )
      ) as access_codes
    FROM restrooms r
    LEFT JOIN access_codes ac ON r.id = ac.restroom_id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const restrooms = rows.map((row: any) => ({
      ...row,
      access_codes: JSON.parse(row.access_codes).filter((code: any) => code.id !== null)
    }));
    
    res.json(restrooms);
  });
});

// Add a new restroom
router.post('/', (req, res) => {
  const { name, latitude, longitude, type } = req.body;
  
  if (!name || !latitude || !longitude || !type) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const query = `INSERT INTO restrooms (name, latitude, longitude, type) VALUES (?, ?, ?, ?)`;
  
  db.run(query, [name, latitude, longitude, type], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      id: this.lastID,
      name,
      latitude,
      longitude,
      type,
      message: 'Restroom added successfully' 
    });
  });
});

// Add access code to restroom
router.post('/:id/codes', (req, res) => {
  const { code } = req.body;
  const restroomId = req.params.id;
  
  if (!code) {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  const query = `INSERT INTO access_codes (restroom_id, code) VALUES (?, ?)`;
  
  db.run(query, [restroomId, code], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'This code already exists for this restroom' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    
    res.json({ 
      id: this.lastID,
      restroom_id: restroomId,
      code,
      likes: 0,
      dislikes: 0,
      message: 'Access code added successfully' 
    });
  });
});

// Update restroom name
router.put('/:id', (req, res) => {
  const { name } = req.body;
  const restroomId = req.params.id;
  
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  const updateQuery = `UPDATE restrooms SET name = ? WHERE id = ?`;
  
  db.run(updateQuery, [name.trim(), restroomId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Restroom not found' });
      return;
    }
    
    // Return the full updated restroom with access codes
    const selectQuery = `
      SELECT 
        r.id,
        r.name,
        r.latitude,
        r.longitude,
        r.type,
        r.created_at,
        JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', ac.id,
            'code', ac.code,
            'likes', ac.likes,
            'dislikes', ac.dislikes,
            'created_at', ac.created_at
          )
        ) as access_codes
      FROM restrooms r
      LEFT JOIN access_codes ac ON r.id = ac.restroom_id
      WHERE r.id = ?
      GROUP BY r.id
    `;
    
    db.get(selectQuery, [restroomId], (err, row: any) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!row) {
        res.status(404).json({ error: 'Restroom not found' });
        return;
      }
      
      const restroom = {
        ...row,
        access_codes: JSON.parse(row.access_codes).filter((code: any) => code.id !== null)
      };
      
      res.json(restroom);
    });
  });
});

// Like/dislike a code
router.post('/codes/:id/vote', (req, res) => {
  const { type } = req.body; // 'like' or 'dislike'
  const codeId = req.params.id;
  
  if (!type || !['like', 'dislike'].includes(type)) {
    res.status(400).json({ error: 'Vote type must be "like" or "dislike"' });
    return;
  }

  const field = type === 'like' ? 'likes' : 'dislikes';
  const query = `UPDATE access_codes SET ${field} = ${field} + 1 WHERE id = ?`;
  
  db.run(query, [codeId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Access code not found' });
      return;
    }
    
    res.json({ message: `${type} recorded successfully` });
  });
});

export default router;