#!/usr/bin/env node

/**
 * Script para ejecutar migraciones SQL directamente
 * Similar a como lo hace el servidor original
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(process.cwd(), '.env') });

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medhome_visits',
  multipleStatements: true,
};

async function runMigrations() {
  let connection;
  
  try {
    console.log('🔌 Conectando a MySQL...');
    connection = await mysql.createConnection({
      ...config,
      database: undefined, // Conectar sin especificar DB primero
    });

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
    await connection.query(`USE ${config.database}`);
    console.log(`✅ Base de datos ${config.database} lista`);

    // Leer y ejecutar migraciones SQL
    const migrationsPath = join(process.cwd(), 'server', 'src', 'db', 'migrations.sql');
    const migrationsSQL = readFileSync(migrationsPath, 'utf-8');
    
    console.log('📦 Ejecutando migraciones...');
    await connection.query(migrationsSQL);
    console.log('✅ Migraciones ejecutadas exitosamente');

    // Ejecutar seed si existe
    const seedPath = join(process.cwd(), 'server', 'src', 'db', 'seed.sql');
    try {
      const seedSQL = readFileSync(seedPath, 'utf-8');
      console.log('🌱 Ejecutando seed...');
      await connection.query(seedSQL);
      console.log('✅ Seed ejecutado exitosamente');
    } catch (err) {
      console.log('⚠️  Seed no encontrado o error (continuando...)');
    }

    console.log('\n✅ ¡Migraciones completadas!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 MySQL no está corriendo. Ejecuta:');
      console.error('   brew services start mysql');
      console.error('   o');
      console.error('   sudo /usr/local/mysql/support-files/mysql.server start');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();




