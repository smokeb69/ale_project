import mysql from 'mysql2/promise';

async function createDB() {
  console.log('Attempting to connect to MySQL...');
  try {
    // Connect without database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306
    });

    console.log('Connected to MySQL, creating database...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS ale_project');
    console.log('Database ale_project created successfully');

    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error.message);
    console.error('Code:', error.code);
  }
}

createDB();