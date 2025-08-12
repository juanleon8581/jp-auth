# JP Auth API

Centralized Authentication API built with Express, TypeScript, Supabase Auth and PostgreSQL.

## 🚀 Features

- **Clean Architecture**: Clear separation between Domain, Infrastructure and Presentation
- **TypeScript**: Strong typing for better robustness
- **Supabase Auth**: Managed authentication service
- **PostgreSQL + Prisma**: Relational database with type-safe ORM
- **Docker**: Containerization for development and production
- **Testing**: Unit and integration tests with Jest
- **Documentation**: API docs with Swagger/OpenAPI

## 📋 Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- Supabase account

## 🛠️ Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit the `.env` file with your configurations:

- `DATABASE_URL`: PostgreSQL connection URL
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

### 3. Setup database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

## 🐳 Docker Development

### Start services

```bash
docker-compose up -d
```

This will start:
- API at `http://localhost:3000`
- PostgreSQL at `localhost:5432`
- Redis at `localhost:6379`

## 🏃‍♂️ Local Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start in production
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Code coverage
npm run test:coverage
```

## 📚 API Documentation

Once the server is started, documentation will be available at:

- Swagger UI: `http://localhost:3000/docs`

## 🏗️ Project Structure

```
src/
├── domain/           # Business logic
│   ├── entities/     # Domain entities
│   ├── repositories/ # Repository interfaces
│   └── usecases/     # Use cases
├── infrastructure/   # Technical implementations
│   ├── repositories/ # Repository implementations
│   ├── services/     # External services
│   └── config/       # Configurations
├── presentation/     # Presentation layer
│   ├── controllers/  # HTTP controllers
│   ├── routes/       # Route definitions
│   └── middlewares/  # Express middlewares
└── main.ts          # Entry point
```

## 🔐 Main Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh token
- `PATCH /api/v1/auth/update` - Update user
- `POST /api/v1/auth/reset-password` - Password recovery

## 🚀 Deployment

The project is configured for deployment on Railway with Docker.

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help, please open an issue in the repository.
