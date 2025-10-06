import { NextApiRequest, NextApiResponse } from 'next';
import { createSwaggerSpec } from 'next-swagger-doc';

const apiFolder = './pages/api';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Prueba Tecnica Fullstack API',
        version: '1.0.0',
        description: 'API documentation',
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        },
      ],
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'User ID',
              },
              name: {
                type: 'string',
                description: 'User name',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'User email',
              },
              role: {
                type: 'string',
                enum: ['user', 'admin'],
                description: 'User role',
              },
            },
          },
          Transaction: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Transaction ID',
              },
              concepto: {
                type: 'string',
                description: 'Transaction concept',
              },
              monto: {
                type: 'number',
                description: 'Transaction amount',
              },
              fecha: {
                type: 'string',
                format: 'date-time',
                description: 'Transaction date',
              },
              userId: {
                type: 'string',
                description: 'User ID who created the transaction',
              },
              user: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apiFolder,
  });

  res.status(200).json(spec);
}
