const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const mysql = require('mysql');


if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {

  const app = express();

  // Configuração da conexão com o MySQL
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dbpwd',
    database: 'testdb',
  });

  // Conectar ao banco de dados
  connection.connect((err) => {
    if (err) {
      console.error('Erro ao conectar ao MySQL: ', err);
    } else {
      console.log('Conexão com o MySQL estabelecida com sucesso.');
    }
  });

  // Rota inicial
  app.get('/', (req, res) => {
    res.send('Olá, mundo!');
  });

  // Rota para recuperar dados do banco de dados
  app.get('/usuarios', (req, res) => {
    connection.query('SELECT * FROM users', (err, rows) => {
      if (err) {
        console.error('Erro ao executar a consulta: ', err);
        res.status(500).json({ error: 'Erro ao recuperar usuários do banco de dados' });
      } else {
        res.json(rows);
      }
    });
  });



  // Inicia o servidor na porta 3000
  app.listen(3000, () => {
    console.log('Servidor iniciado na porta 3000');
  });

  console.log(`Worker ${process.pid} started`);
}