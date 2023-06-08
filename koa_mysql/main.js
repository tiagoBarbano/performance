const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const Koa = require('koa');
const Router = require('koa-router');
const mysql = require('mysql2/promise');


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

  const app = new Koa();
  const router = new Router();

  // Configurações do banco de dados
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'dbpwd',
    database: 'testdb'
  };

  // Rota para realizar a consulta
  router.get('/', async (ctx) => {
    try {
      // Conecta ao banco de dados MySQL
      const connection = await mysql.createConnection(dbConfig);

      // Executa a consulta
      const [rows] = await connection.query('SELECT * FROM users');

      // Fecha a conexão com o banco de dados
      connection.end();

      // Retorna os resultados como resposta HTTP
      ctx.body = rows;
    } catch (err) {
      console.error('Erro ao executar a consulta:', err);
      ctx.status = 500;
      ctx.body = 'Erro ao executar a consulta';
    }
  });

  // Define as rotas
  app.use(router.routes()).use(router.allowedMethods());

  // Inicia o servidor na porta 3000
  app.listen(3000, () => {
    console.log('Servidor iniciado na porta 3000');
  });
  
  console.log(`Worker ${process.pid} started`);
}