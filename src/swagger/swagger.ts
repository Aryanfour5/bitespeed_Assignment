import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export function setupSwagger(app: Express) {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Contact Management API',
        version: '1.0.0',
        description: 'API for identifying and managing duplicate contacts',
      },
    },
    // Make sure the path points to the correct TS route files (use absolute or relative from project root)
    apis: ['src/routes/*.ts'], // ✅ not './routes/*.ts'
  };

  const swaggerSpec = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
