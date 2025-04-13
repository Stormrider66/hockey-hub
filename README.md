# Hockey Hub

A comprehensive hockey team management application built with Next.js, TypeScript, and shadcn/ui. This application helps hockey teams manage their players, schedules, training sessions, medical records, and more.

## Features

- 🏒 Team Management
- 📅 Schedule & Calendar
- 💪 Training Programs
- 🏥 Medical Records
- 📊 Statistics & Analytics
- 💰 Payment Management
- 👥 User Management
- 🌐 Multi-language Support (English & Swedish)

## Tech Stack

- **Frontend**: Next.js, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Node.js microservices
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Stormrider66/hockey-hub.git
   cd hockey-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Start the development environment:
   ```bash
   docker-compose up -d    # Start required services
   npm run dev            # Start development server
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
hockey-hub/
├── apps/                # Frontend applications
├── services/            # Backend microservices
├── packages/            # Shared packages
└── development/        # Development utilities
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 