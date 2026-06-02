import path from 'path';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

export const docsRouter = Router();

const openApiPath = path.resolve(process.cwd(), 'openapi.yaml');

docsRouter.get('/openapi.yaml', (_req, res) => {
  res.type('yaml').sendFile(openApiPath);
});

docsRouter.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/openapi.yaml'
    }
  })
);
