import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node.js TS API Docs',
      version: '1.0.0',
      description: 'API documentation for my TypeScript project',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Đường dẫn đến các file chứa @swagger (Lưu ý: dùng .ts khi dev và .js khi đã build)
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], 
};

export const swaggerSpec = swaggerJsdoc(options);