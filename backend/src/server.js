import { app } from './app.js';
import { assertConnection } from './config/db.js';

const PORT = Number(process.env.PORT || 3001);

async function bootstrap() {
  try {
    await assertConnection();
    console.log('[db] conexao com MySQL OK');
  } catch (err) {
    console.error('[db] falha ao conectar no MySQL:', err.message);
    console.error('     verifique o backend/.env e se o banco esta no ar.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[api] TestAudit ouvindo em http://localhost:${PORT}`);
  });
}

bootstrap();
