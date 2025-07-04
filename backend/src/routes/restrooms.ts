import express from 'express';
import { db } from '../database';

const router = express.Router();

// Get all restrooms with their codes and location info
router.get('/', (req, res) => {
  const query = `
    SELECT 
      r.id,
      r.name,
      r.type,
      r.created_at,
      l.id as location_id,
      l.name as location_name,
      l.latitude,
      l.longitude,
      l.address,
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
    JOIN locations l ON r.location_id = l.id
    LEFT JOIN access_codes ac ON r.id = ac.restroom_id
    GROUP BY r.id
    ORDER BY l.created_at DESC, r.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const restrooms = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      created_at: row.created_at,
      latitude: row.latitude, // Keep for backward compatibility
      longitude: row.longitude, // Keep for backward compatibility
      location: {
        id: row.location_id,
        name: row.location_name,
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address
      },
      access_codes: JSON.parse(row.access_codes).filter((code: any) => code.id !== null)
    }));
    
    res.json(restrooms);
  });
});

// Add a new restroom
router.post('/', (req, res) => {
  const { name, latitude, longitude, type, locationName } = req.body;
  
  if (!name || !latitude || !longitude || !type) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // First, check if a location already exists at these coordinates (within ~10 meters)
  const findLocationQuery = `
    SELECT id FROM locations 
    WHERE ABS(latitude - ?) < 0.0001 AND ABS(longitude - ?) < 0.0001
    LIMIT 1
  `;
  
  db.get(findLocationQuery, [latitude, longitude], (err, existingLocation: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (existingLocation) {
      // Location exists, just add restroom to it
      const restroomQuery = `INSERT INTO restrooms (location_id, name, type) VALUES (?, ?, ?)`;
      
      db.run(restroomQuery, [existingLocation.id, name, type], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Return the full restroom with location info
        returnCreatedRestroom(res, this.lastID);
      });
    } else {
      // Create new location first
      const locationQuery = `INSERT INTO locations (name, latitude, longitude) VALUES (?, ?, ?)`;
      const finalLocationName = locationName || name; // Use locationName if provided, otherwise use restroom name
      
      db.run(locationQuery, [finalLocationName, latitude, longitude], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        const locationId = this.lastID;
        
        // Now add restroom
        const restroomQuery = `INSERT INTO restrooms (location_id, name, type) VALUES (?, ?, ?)`;
        
        db.run(restroomQuery, [locationId, name, type], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          // Return the full restroom with location info
          returnCreatedRestroom(res, this.lastID);
        });
      });
    }
  });
});

// Helper function to return the full restroom object after creation
function returnCreatedRestroom(res: any, restroomId: number) {
  const query = `
    SELECT 
      r.id,
      r.name,
      r.type,
      r.created_at,
      l.id as location_id,
      l.name as location_name,
      l.latitude,
      l.longitude,
      l.address
    FROM restrooms r
    JOIN locations l ON r.location_id = l.id
    WHERE r.id = ?
  `;
  
  db.get(query, [restroomId], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const restroom = {
      id: row.id,
      name: row.name,
      type: row.type,
      created_at: row.created_at,
      latitude: row.latitude, // For backward compatibility
      longitude: row.longitude, // For backward compatibility
      location: {
        id: row.location_id,
        name: row.location_name,
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address
      },
      access_codes: [] // New restroom has no codes yet
    };
    
    res.json(restroom);
  });
}

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
    
    // Return the full updated restroom with access codes and location
    const selectQuery = `
      SELECT 
        r.id,
        r.name,
        r.type,
        r.created_at,
        l.id as location_id,
        l.name as location_name,
        l.latitude,
        l.longitude,
        l.address,
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
      JOIN locations l ON r.location_id = l.id
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
        id: row.id,
        name: row.name,
        type: row.type,
        created_at: row.created_at,
        latitude: row.latitude, // For backward compatibility
        longitude: row.longitude, // For backward compatibility
        location: {
          id: row.location_id,
          name: row.location_name,
          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address
        },
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