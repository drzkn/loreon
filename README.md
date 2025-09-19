# 🤖 Loreon AI

An intelligent chat application with RAG (Retrieval-Augmented Generation) capabilities that integrates Notion content and enables advanced vector search.

## ✨ Features

- 🤖 **AI Chat** - Conversational interface powered by Vercel AI SDK
- 📚 **RAG Integration** - Vector search in markdown content using pgvector
- 🔗 **Notion Integration** - Automatic content synchronization from Notion
- 📝 **Markdown Visualizer** - Rendering and visualization of markdown files
- 🎨 **Modern UI** - Components with styled-components and glassmorphism design
- 🧪 **Complete Testing** - Test suite with Vitest
- 📖 **Storybook** - Interactive component documentation
- 🔄 **Git Hooks** - Automatic validation with Husky

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Static typing
- **Styled Components** - CSS-in-JS for styling
- **Lucide React** - Modern iconography

### AI & Backend

- **Vercel AI SDK** - AI model integration
- **Supabase** - PostgreSQL database with pgvector
- **Notion API** - Notion workspace integration

### Development & Testing

- **Vitest** - Fast testing framework
- **Storybook** - Component documentation
- **ESLint** - Code linting and analysis
- **Husky** - Git hooks for CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20.0.0
- Yarn ≥ 1.22.0

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/loreon.git
cd loreon

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Notion API
NOTION_TOKEN=your_notion_token

# AI (Vercel AI SDK)
OPENAI_API_KEY=your_openai_api_key
# or
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
```

### Development

```bash
# Start development server
yarn dev

# Open Storybook
yarn storybook

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # Page components
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── Icon/             # Icon system
│   ├── Navigation/       # Navigation with dropdown
│   ├── Button/           # Base components
│   └── ...
├── domain/               # Business logic
│   ├── entities/         # Domain entities
│   ├── usecases/         # Use cases
│   └── repositories/     # Repository interfaces
├── adapters/             # External adapters
│   └── output/           # Repository implementations
├── services/             # Application services
│   ├── embeddings/       # Embedding generation
│   ├── markdownConverter/ # Markdown conversion
│   └── supabase/         # Supabase services
└── utils/                # General utilities
```

## 🎯 Available Scripts

### Development

```bash
yarn dev              # Development server
yarn build             # Production build
yarn start             # Production server
yarn lint              # Code analysis
```

### Testing

```bash
yarn test              # Tests in watch mode
yarn test:run          # Run tests once
yarn test:coverage     # Tests with coverage
yarn test:ui           # Visual test interface
```

### Storybook

```bash
yarn storybook         # Storybook server
yarn build-storybook   # Storybook build
```

### Utilities

```bash
yarn clean             # Clean Next.js cache
yarn test:connection   # Test service connections
yarn example:supabase  # Supabase example
```

## 🏗️ Architecture

### Clean Architecture

The project follows Clean Architecture principles with:

- **Entities**: Domain models
- **Use Cases**: Business logic
- **Adapters**: External service interfaces
- **Infrastructure**: Specific implementations

### RAG Pipeline

1. **Ingestion**: Notion content → Markdown
2. **Processing**: Markdown → Chunks + Embeddings
3. **Storage**: Supabase with pgvector
4. **Search**: Query → Embeddings → Similar results
5. **Generation**: Context + Query → AI response

## 🧪 Testing

### Testing Strategy

- **Unit**: Business logic and utilities
- **Integration**: Services and repositories
- **Components**: React Testing Library

### Running Tests

```bash
# Tests in watch mode
yarn test

# Tests with coverage
yarn test:coverage

# Specific tests
yarn test Navigation.test.tsx
```

## 📚 Storybook

Interactive component documentation available at:

```bash
yarn storybook
# Opens http://localhost:6006
```

### Documented Components

- 🎨 **Design System**: Tokens, colors, typography
- 🧩 **Components**: Button, Icon, Card, Navigation
- 📱 **Patterns**: Layouts, forms, feedback

## 🔄 CI/CD

### Git Hooks (Husky)

- **pre-push**: Automatic tests + build
- **pre-commit**: Automatic linting

### GitHub Actions

```yaml
# Automatic workflow on push/PR
- Unit and integration tests
- Build and validation
- Deploy to Vercel (production)
```

## 🚀 Deploy

### Vercel (Recommended)

```bash
# Automatic deploy by connecting GitHub
vercel --prod
```

### Manual

```bash
yarn build
yarn start
```

## 🤝 Contributing

1. Fork the project
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add: new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Create Pull Request

### Code Standards

- **TypeScript**: Strict typing
- **ESLint**: Custom configuration
- **Styled Components**: For styling
- **Tests**: Minimum 80% coverage

## 📝 License

This project is under the MIT License. See [LICENSE](LICENSE) for more details.

## 🆘 Support

- 📧 **Email**: support@loreon.dev
- 💬 **Issues**: [GitHub Issues](https://github.com/your-username/loreon/issues)
- 📖 **Docs**: [Complete documentation](https://docs.loreon.dev)

---

Developed with ❤️ using Next.js and Vercel AI SDK
