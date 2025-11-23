import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library Management System API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Library Management System',
      contact: {
        name: 'API Support',
        email: 'support@library.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.library.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            username: {
              type: 'string',
              example: 'john_doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['admin', 'librarian', 'member'],
              example: 'member',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Book: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'The Great Gatsby',
            },
            author: {
              type: 'string',
              example: 'F. Scott Fitzgerald',
            },
            isbn: {
              type: 'string',
              example: '978-0-7432-7356-5',
            },
            publisher: {
              type: 'string',
              example: 'Scribner',
            },
            publication_year: {
              type: 'integer',
              example: 1925,
            },
            category: {
              type: 'string',
              example: 'Fiction',
            },
            quantity: {
              type: 'integer',
              example: 10,
            },
            available_quantity: {
              type: 'integer',
              example: 7,
            },
            description: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            member_id: {
              type: 'integer',
              example: 1,
            },
            book_id: {
              type: 'integer',
              example: 1,
            },
            issue_date: {
              type: 'string',
              format: 'date',
              example: '2023-11-01',
            },
            due_date: {
              type: 'string',
              format: 'date',
              example: '2023-11-15',
            },
            return_date: {
              type: 'string',
              format: 'date',
              nullable: true,
            },
            fine_amount: {
              type: 'number',
              format: 'float',
              example: 0.0,
            },
            status: {
              type: 'string',
              enum: ['issued', 'returned', 'overdue'],
              example: 'issued',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;


