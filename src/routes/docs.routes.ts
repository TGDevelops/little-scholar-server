import path from 'path';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

export const docsRouter = Router();

const openApiPath = path.resolve(process.cwd(), 'openapi.yaml');
const openApiJsonPath = path.resolve(process.cwd(), 'openapi.json');

docsRouter.get('/openapi.yaml', (_req, res) => {
  res.type('yaml').sendFile(openApiPath);
});

docsRouter.get('/openapi.json', (_req, res) => {
  res.type('json').sendFile(openApiJsonPath);
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
