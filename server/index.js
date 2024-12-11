import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, chmodSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { promisify } from 'util';

// Store logs in memory
const serverLogs = [];

function addLog(message, type = 'info', details = '') {
  const log = {
    timestamp: new Date().toISOString(),
    message,
    type,
    details
  };
  serverLogs.push(log);
  // Keep only last 100 logs
  if (serverLogs.length > 100) {
    serverLogs.shift();
  }
  console.log(`[${log.type.toUpperCase()}] ${log.message}`);
  return log;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

addLog('Iniciando sistema de reservas...', 'info');
addLog(`Ruta de la base de datos: ${dbPath}`, 'info');

// Ensure database directory exists with proper permissions
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true, mode: 0o755 });
  addLog('Directorio de base de datos creado', 'success');
}

// Create empty database file if it doesn't exist
if (!existsSync(dbPath)) {
  writeFileSync(dbPath, '', { mode: 0o666 });
  addLog('Archivo de base de datos creado con permisos correctos', 'success');
}

// Ensure database file has correct permissions
try {
  chmodSync(dbPath, 0o666);
  addLog('Permisos de archivo de base de datos actualizados', 'success');
} catch (error) {
  addLog('Error al actualizar permisos de archivo', 'error', error.message);
}

const app = express();
const port = 3000;

// Create database connection with write permissions
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    addLog('Error al abrir la base de datos', 'error', err.message);
    process.exit(1);
  }
  addLog('Conexión exitosa a la base de datos', 'success');
});

// Promisify database operations
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else {
        resolve({
          lastID: this ? this.lastID : undefined,
          changes: this ? this.changes : 0
        });
      }
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

addLog('Operaciones de base de datos configuradas', 'success');

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));

addLog('CORS configurado', 'success');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

async function initializeDatabase() {
  try {
    addLog('=== Iniciando Inicialización de Base de Datos ===', 'info');

    addLog('1. Configurando ajustes de base de datos...', 'info');
    await dbRun('PRAGMA foreign_keys = ON');
    await dbRun('PRAGMA journal_mode = WAL');
    await dbRun('PRAGMA synchronous = NORMAL');
    await dbRun('PRAGMA busy_timeout = 5000');
    await dbRun('PRAGMA temp_store = MEMORY');
    addLog('✓ Ajustes de base de datos configurados correctamente', 'success');
    
    // Create tables if they don't exist
    addLog('2. Creando esquema de base de datos...', 'info');
    await dbRun(`CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      building TEXT NOT NULL
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      days TEXT NOT NULL DEFAULT '["L","M","X","J","V"]'
    )`);

    await dbRun(`CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      time_slot_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      user_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      groups TEXT,
      FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT,
      FOREIGN KEY (time_slot_id) REFERENCES time_slots (id) ON DELETE RESTRICT,
      UNIQUE(room_id, time_slot_id, date)
    )`);

    // Insert sample data if tables are empty
    const roomCount = await dbGet('SELECT COUNT(*) as count FROM rooms');
    if (roomCount.count === 0) {
      addLog('3. Insertando salas de ejemplo...', 'info');
      
      // Begin transaction for batch inserts
      await dbRun('BEGIN TRANSACTION');
      
      const rooms = [
        { name: 'Sala 101', capacity: 30, building: 'Edificio 1' },
        { name: 'Sala 102', capacity: 25, building: 'Edificio 1' },
        { name: 'Sala 103', capacity: 40, building: 'Edificio 2' },
        { name: 'Laboratorio A', capacity: 20, building: 'Edificio 2' },
        { name: 'Laboratorio B', capacity: 20, building: 'Edificio 3' },
      ];
      
      for (const room of rooms) {
        try {
          await dbRun(
        'INSERT INTO rooms (name, capacity, building) VALUES (?, ?, ?)',
            [room.name, room.capacity, room.building]
          );
        } catch (error) {
          await dbRun('ROLLBACK');
          addLog(`Error al insertar sala: ${room.name}`, 'error', error.message);
          throw error;
        }
      }
      
      await dbRun('COMMIT');
      addLog('✓ Salas de ejemplo insertadas correctamente', 'success');
    } else {
      addLog(`3. Tabla de salas ya poblada: ${roomCount.count} salas encontradas`, 'info');
    }

    const timeSlotCount = await dbGet('SELECT COUNT(*) as count FROM time_slots');
    if (timeSlotCount.count === 0) {
      addLog('4. Insertando horarios de ejemplo...', 'info');
      
      // Begin transaction for batch inserts
      await dbRun('BEGIN TRANSACTION');
      
      const timeSlots = [
        { start: '08:00', end: '09:30', days: '["L","M","X","J","V"]' },
        { start: '09:45', end: '11:15', days: '["L","M","X","J","V"]' },
        { start: '11:30', end: '13:00', days: '["L","M","X","J","V"]' },
        { start: '14:00', end: '15:30', days: '["L","M","X","J"]' },
        { start: '15:45', end: '17:15', days: '["L","M","X"]' },
      ];
      
      for (const slot of timeSlots) {
        try {
          await dbRun(
            'INSERT INTO time_slots (start, end, days) VALUES (?, ?, ?)',
            [slot.start, slot.end, slot.days]
          );
        } catch (error) {
          await dbRun('ROLLBACK');
          addLog(`Error al insertar horario: ${slot.start}-${slot.end}`, 'error', error.message);
          throw error;
        }
      }
      
      await dbRun('COMMIT');
      addLog('✓ Horarios de ejemplo insertados correctamente', 'success');
    } else {
      addLog(`4. Tabla de horarios ya poblada: ${timeSlotCount.count} horarios encontrados`, 'info');
    }
    addLog('=== Inicialización de Base de Datos Completada con Éxito ===', 'success');
  } catch (error) {
    addLog('=== Fallo en la Inicialización de Base de Datos ===', 'error');
    addLog('Detalles del error:', 'error', error.message);
    addLog('Stack trace:', 'error', error.stack);
    process.exit(1);
  }
}

// API Route for logs
app.get('/api/logs', (req, res) => {
  res.json(serverLogs);
});

// API Routes
app.get('/api/rooms', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM rooms');
    addLog(`Enviando ${rows.length} salas al cliente`, 'info');
    res.json(rows);
  } catch (error) {
    addLog('Error al obtener salas', 'error', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/time-slots', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM time_slots');
    console.log('Sending time slots:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const { date } = req.query;
    const rows = await dbAll('SELECT * FROM reservations WHERE date = ?', [date]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { room_id, time_slot_id, date, user_id, purpose, groups } = req.body;
    
    // Validate required fields
    if (!room_id || !time_slot_id || !date || !user_id || !purpose) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Convert IDs to numbers if they're strings
    const roomId = Number(room_id);
    const timeSlotId = Number(time_slot_id);

    if (isNaN(roomId) || isNaN(timeSlotId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    // Validate room exists
    const room = await dbGet('SELECT id FROM rooms WHERE id = ?', [roomId]);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    // Validate time slot exists
    const timeSlot = await dbGet('SELECT id FROM time_slots WHERE id = ?', [timeSlotId]);
    if (!timeSlot) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    // Check if slot is already reserved
    const existingReservation = await dbGet(`
      SELECT id FROM reservations 
      WHERE room_id = ? AND time_slot_id = ? AND date = ?
    `, [roomId, timeSlotId, date]);
    
    if (existingReservation) {
      return res.status(409).json({ error: 'Horario ya reservado' });
    }

    try {
      const result = await dbRun(`
      INSERT INTO reservations (room_id, time_slot_id, date, user_id, purpose, groups) 
      VALUES (?, ?, ?, ?, ?, ?)
      `,
        [roomId, timeSlotId, date, user_id, purpose, groups]
      );
      
      const newReservation = await dbGet(
        'SELECT * FROM reservations WHERE id = ?',
        [result.lastID]
      );
      
      res.status(201).json(newReservation);
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Horario ya reservado' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.' 
    });
  }
});

// Admin Routes for Rooms
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, capacity, building } = req.body;
    addLog(`Iniciando creación de sala: ${name}`, 'info');

    const capacityNum = parseInt(capacity, 10);
    
    if (!name || isNaN(capacityNum) || !building) {
      addLog('Error: datos inválidos para crear sala', 'error', { name, capacity, building });
      return res.status(400).json({ error: 'Nombre, capacidad y edificio son requeridos' });
    }

    // Validate capacity is positive
    if (capacityNum <= 0) {
      return res.status(400).json({ error: 'La capacidad debe ser un número positivo' });
    }

    await dbRun('BEGIN TRANSACTION');
    
    try {
      const result = await dbRun(
        'INSERT INTO rooms (name, capacity, building) VALUES (?, ?, ?)',
        [name.trim(), capacityNum, building.trim()]
      );

      addLog(`Sala insertada con ID: ${result.lastID}`, 'success');
      
      if (!result || !result.lastID) {
        throw new Error('Error al obtener el ID de la nueva sala');
      }

      const newRoom = await dbGet('SELECT * FROM rooms WHERE id = ?', [result.lastID]);
      if (!newRoom) {
        throw new Error('No se pudo recuperar la sala creada');
      }
      
      await dbRun('COMMIT');
      addLog(`Sala creada: ${name} en ${building}`, 'success');
      res.status(201).json(newRoom);
    } catch (error) {
      await dbRun('ROLLBACK');
      addLog('Error en la transacción al crear sala', 'error', error.message);
      throw error;
    }
  } catch (error) {
    addLog('Error al crear sala', 'error', error.message);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, building } = req.body;
    const capacityNum = Number(capacity);

    if (!name || isNaN(capacityNum) || !building) {
      addLog('Error al actualizar sala: datos inválidos', 'error', { id, name, capacity, building });
      return res.status(400).json({ 
        error: 'Nombre, capacidad y edificio son requeridos',
        details: { name, capacity: capacityNum, building }
      });
    }

    await dbRun('BEGIN TRANSACTION');
    
    try {
      const result = await dbRun(
        'UPDATE rooms SET name = ?, capacity = ?, building = ? WHERE id = ?',
        [name.trim(), capacityNum, building.trim(), id]
      );

      if (result.changes === 0) {
        await dbRun('ROLLBACK');
        return res.status(404).json({ error: 'Sala no encontrada' });
      }

      const updatedRoom = await dbGet('SELECT * FROM rooms WHERE id = ?', [id]);
      if (!updatedRoom) {
        await dbRun('ROLLBACK');
        return res.status(404).json({ error: 'Sala no encontrada' });
      }

      await dbRun('COMMIT');
      addLog(`Sala actualizada: ${name}`, 'success');
      res.json(updatedRoom);
    } catch (error) {
      await dbRun('ROLLBACK');
      throw error;
    }
  } catch (error) {
    addLog('Error al actualizar sala', 'error', error.message);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    addLog(`Iniciando eliminación de sala ${id}`, 'info');

    await dbRun('BEGIN TRANSACTION');

    // Check if room exists and get its details
    const room = await dbGet('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!room) {
      addLog(`Sala ${id} no encontrada`, 'error');
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    // Check if room has reservations
    const reservations = await dbGet(
      'SELECT COUNT(*) as count FROM reservations WHERE room_id = ?',
      [id]
    );

    if (reservations.count > 0) {
      addLog(`No se puede eliminar sala ${id}: tiene ${reservations.count} reservas`, 'error');
      await dbRun('ROLLBACK');
      return res.status(400).json({
        error: 'No se puede eliminar la sala porque tiene reservas asociadas'
      });
    }

    const result = await dbRun('DELETE FROM rooms WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      await dbRun('ROLLBACK');
      addLog(`Error al eliminar sala ${id}: no se realizaron cambios`, 'error');
      return res.status(500).json({ error: 'Error al eliminar la sala' });
    }

    await dbRun('COMMIT');
    addLog(`Sala ${room.name} eliminada correctamente`, 'success');
    res.status(200).json({ message: 'Sala eliminada correctamente' });
  } catch (error) {
    await dbRun('ROLLBACK');
    addLog('Error al eliminar sala', 'error', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Admin Routes for Time Slots
app.post('/api/time-slots', async (req, res) => {
  try {
    const { start, end, days } = req.body;
    if (!start || !end || !days || !Array.isArray(days)) {
      return res.status(400).json({ 
        error: 'Hora de inicio, fin y días de la semana son requeridos' 
      });
    }

    await dbRun('BEGIN TRANSACTION');
    
    try {
      const result = await dbRun(
        'INSERT INTO time_slots (start, end, days) VALUES (?, ?, ?)',
        [start, end, JSON.stringify(days)]
      );

      const newTimeSlot = await dbGet('SELECT * FROM time_slots WHERE id = ?', [result.lastID]);
      
      await dbRun('COMMIT');
      addLog(`Horario creado: ${start} - ${end}`, 'success');
      res.status(201).json(newTimeSlot);
    } catch (error) {
      await dbRun('ROLLBACK');
      throw error;
    }
  } catch (error) {
    addLog('Error al crear horario', 'error', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/time-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, days } = req.body;

    if (!start || !end || !days) {
      return res.status(400).json({ error: 'Hora de inicio, fin y días son requeridos' });
    }

    await dbRun(
      'UPDATE time_slots SET start = ?, end = ?, days = ? WHERE id = ?',
      [start, end, days, id]
    );

    const updatedTimeSlot = await dbGet('SELECT * FROM time_slots WHERE id = ?', [id]);
    if (!updatedTimeSlot) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    res.json(updatedTimeSlot);
  } catch (error) {
    console.error('Error updating time slot:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/time-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    addLog(`Iniciando eliminación de horario ${id}`, 'info');

    await dbRun('BEGIN TRANSACTION');

    // Check if time slot exists and get its details
    const timeSlot = await dbGet('SELECT * FROM time_slots WHERE id = ?', [id]);
    if (!timeSlot) {
      addLog(`Horario ${id} no encontrado`, 'error');
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    // Check if time slot has reservations
    const reservations = await dbGet(
      'SELECT COUNT(*) as count FROM reservations WHERE time_slot_id = ?',
      [id]
    );

    if (reservations.count > 0) {
      addLog(`No se puede eliminar horario ${id}: tiene ${reservations.count} reservas`, 'error');
      await dbRun('ROLLBACK');
      return res.status(400).json({
        error: 'No se puede eliminar el horario porque tiene reservas asociadas'
      });
    }

    const result = await dbRun('DELETE FROM time_slots WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      await dbRun('ROLLBACK');
      addLog(`Error al eliminar horario ${id}: no se realizaron cambios`, 'error');
      return res.status(500).json({ error: 'Error al eliminar el horario' });
    }

    await dbRun('COMMIT');
    addLog(`Horario ${timeSlot.start}-${timeSlot.end} eliminado correctamente`, 'success');
    res.status(200).json({ message: 'Horario eliminado correctamente' });
  } catch (error) {
    await dbRun('ROLLBACK');
    addLog('Error al eliminar horario', 'error', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Initialize database and start server
initializeDatabase().then(() => app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}));