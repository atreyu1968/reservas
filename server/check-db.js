import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chmod } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

// Set database file permissions
try {
  await chmod(dbPath, 0o666);
  console.log('Permisos de base de datos actualizados');
} catch (error) {
  console.error('Error al actualizar permisos:', error);
}
console.log('\n=== Verificación de Base de Datos ===');
console.log('Ubicación:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conexión establecida correctamente\n');
});

// Promisify database operations
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function checkTables() {
  try {
    // Check schema
    console.log('=== Estructura de Tablas ===');
    const tables = await dbAll(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    for (const table of tables) {
      const schema = await dbAll(`PRAGMA table_info(${table.name})`);
      console.log(`\nTabla: ${table.name}`);
      console.log('Columnas:');
      schema.forEach(col => {
        console.log(`  - ${col.name} (${col.type})${col.pk ? ' PRIMARY KEY' : ''}${col.notnull ? ' NOT NULL' : ''}`);
      });
    }

    // Check data
    console.log('\n=== Contenido de las Tablas ===');
    
    // Check rooms
    const rooms = await dbAll('SELECT * FROM rooms ORDER BY id');
    console.log('\nSalas:', rooms.length ? '' : 'No hay registros');
    rooms.forEach(room => {
      console.log(`  [${room.id}] ${room.name} (${room.building}) - Cap: ${room.capacity}`);
    });

    // Check time slots
    const timeSlots = await dbAll('SELECT * FROM time_slots ORDER BY start');
    console.log('\nHorarios:', timeSlots.length ? '' : 'No hay registros');
    timeSlots.forEach(slot => {
      console.log(`  [${slot.id}] ${slot.start} - ${slot.end}`);
    });

    // Check reservations with details
    const reservations = await dbAll(`
      SELECT r.*, rm.name as room_name, ts.start, ts.end 
      FROM reservations r
      JOIN rooms rm ON r.room_id = rm.id
      JOIN time_slots ts ON r.time_slot_id = ts.id
      ORDER BY r.date, ts.start
    `);
    console.log('\nReservas:', reservations.length ? '' : 'No hay registros');
    reservations.forEach(res => {
      console.log(`  [${res.id}] ${res.date} | ${res.room_name} | ${res.start}-${res.end}`);
      console.log(`    Usuario: ${res.user_id}`);
      console.log(`    Propósito: ${res.purpose}`);
      if (res.groups) console.log(`    Grupos: ${res.groups}`);
    });

  } catch (error) {
    console.error('\nError durante la verificación:', error);
  } finally {
    db.close();
  }
}

checkTables();