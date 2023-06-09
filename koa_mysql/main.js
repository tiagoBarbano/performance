const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const Koa = require('koa');
const Router = require('koa-router');
const mysql = require('mysql2/promise');


if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 2; i < numCPUs; i++) {
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
    database: 'testdb',
    waitForConnections: true,
  };

  // Cria um pool de conexão
  const pool = mysql.createPool(dbConfig);

  // Rota para realizar a consulta
  router.get('/', async (ctx) => {
    try {
      // Conecta ao banco de dados MySQL
      const connection = await pool.getConnection();

      // Executa a consulta
      const [rows] = await connection.query('SELECT * FROM users');

      // Libera a conexão de volta para o pool
      connection.release();

      // Retorna os resultados como resposta HTTP
      ctx.body = rows;
    } catch (err) {
      console.error('Erro ao executar a consulta:', err);
      ctx.status = 500;
      ctx.body = 'Erro ao executar a consulta';
    }
  });

  router.get('/hello', async (ctx) => {
    ctx.body = 'Hello World';
  });


  // Define as rotas
  app.use(router.routes()).use(router.allowedMethods());

  // Inicia o servidor na porta 3000
  app.listen(3000, () => {
    console.log('Servidor iniciado na porta 3000');
  });

  console.log(`Worker ${process.pid} started`);
}