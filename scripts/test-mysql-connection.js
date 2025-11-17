#!/usr/bin/env node

/**
 * Script para probar conexión a MySQL y encontrar credenciales correctas
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const configs = [
  { host: '127.0.0.1', user: 'root', password: '' },
  { host: '127.0.0.1', user: 'root', password: 'root' },
  { host: 'localhost', user: 'root', password: '' },
  { host: 'localhost', user: 'root', password: 'root' },
  { 
    host: process.env.DB_HOST || '127.0.0.1', 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '' 
  },
];

async function testConnection(config) {
  try {
    const connection = await mysql.createConnection(config);
    await connection.ping();
    await connection.end();
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message, config };
  }
}

async function main() {
  console.log('🔍 Probando conexiones a MySQL...\n');
  
  for (const config of configs) {
    const result = await testConnection(config);
    if (result.success) {
      console.log('✅ ¡Conexión exitosa!');
      console.log(`   Host: ${config.host}`);
      console.log(`   User: ${config.user}`);
      console.log(`   Password: ${config.password ? '***' : '(vacía)'}`);
      console.log('\n💡 Actualiza tu .env con estas credenciales:');
      console.log(`   DB_HOST=${config.host}`);
      console.log(`   DB_USER=${config.user}`);
      console.log(`   DB_PASSWORD=${config.password || ''}`);
      console.log(`   DATABASE_URL="mysql://${config.user}:${config.password}@${config.host}:3306/medhome_visits"`);
      process.exit(0);
    }
  }
  
  console.log('❌ No se pudo conectar con ninguna configuración probada.\n');
  console.log('💡 Opciones:');
  console.log('   1. Verifica que MySQL esté corriendo: ps aux | grep mysql');
  console.log('   2. Intenta iniciar MySQL: brew services start mysql');
  console.log('   3. Si MySQL requiere contraseña, configúrala en .env:');
  console.log('      DB_PASSWORD=tu_contraseña');
  console.log('      DATABASE_URL="mysql://root:tu_contraseña@127.0.0.1:3306/medhome_visits"');
  process.exit(1);
}

main();




