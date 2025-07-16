# CodeTweak

> A collection of developer utilities designed to streamline common tasks and boost productivity.

[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-ff5d01?logo=astro)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**CodeTweak** is a collection of tools designed to help developers streamline common tasks and boost productivity. Each tool is designed with a focus on usability, performance, and keyboard-driven workflows.

🌐 **Live Site**: [CodeTweak.osimify.com](https://CodeTweak.osimify.com)

## ✨ Features

- **Client-side processing** - Your data never leaves your browser
- **Keyboard shortcuts** - Efficient workflows with minimal mouse usage
- **Responsive design** - Works seamlessly on all devices
- **Persistent settings** - Uses localStorage to remember your preferences
- **Open source** - Free to use and contribute to
- **SEO optimized** - Each tool and pattern has dedicated pages

## 🛠️ Available Tools

### Regex Helper
Transform text using regular expressions with built-in patterns or create your own.

- **Quick Access**: Numeric key access and short key lookup
- **Pattern Management**: Create, edit, delete, and search regex patterns
- **Import/Export**: JSON-based pattern sharing via textarea
- **Command Palette**: Keyboard-driven pattern selection (Cmd+K)
- **Hybrid Layout**: Responsive design that adapts to screen size

**Common Use Cases:**
- Convert Python import paths: `app.services.sub` → `app/services/sub`
- Join multi-line items: `item1\nitem2\nitem3` → `item1,item2,item3`
- Add quotes to lines: `item1\nitem2` → `"item1"\n"item2"`

[🔗 Try Regex Helper](https://CodeTweak.osimify.com/tools/regex)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/peeomid/CodeTweak.git

# Navigate to the project directory
cd CodeTweak

# Install dependencies
npm install

# Start the development server
npm run dev
```

The site will be available at `http://localhost:4321`

## 📝 Development Commands

All commands are run from the root of the project:

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview build locally before deploying |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint on src/ directory |

## 🏗️ Project Structure

```
CodeTweak/
├── src/
│   ├── components/
│   │   ├── common/              # Shared components
│   │   └── regex/               # Regex tool components
│   ├── layouts/
│   │   └── BaseLayout.astro     # Main site layout
│   ├── pages/
│   │   ├── index.astro          # Homepage
│   │   └── tools/
│   │       ├── index.astro      # Tools directory
│   │       └── regex/           # Regex tool pages
│   ├── services/                # Business logic services
│   ├── stores/                  # Nanostores state management
│   ├── types/                   # TypeScript definitions
│   └── utils/                   # Utility functions
├── public/
│   └── data/
│       └── built-in-patterns.json  # Built-in regex patterns
├── llm-docs/                    # Project documentation
└── CLAUDE.md                    # Claude Code guidance
```

## 🏛️ Architecture

CodeTweak is built with:
- **Astro** - Static site generator with islands architecture
- **React** - Interactive UI components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Nanostores** - Lightweight state management
- **Vitest** - Unit testing framework

### Key Design Principles

1. **Programmatic SEO**: Each tool and pattern has dedicated pages
2. **Client-side experience**: No page refreshes within tools
3. **Keyboard-first workflow**: Minimal mouse usage required
4. **Privacy-focused**: All processing happens in the browser
5. **Developer-friendly**: Built by developers, for developers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

### Adding New Tools

1. Create components in `src/components/[tool-name]/`
2. Add pages in `src/pages/tools/[tool-name]/`
3. Create services and types as needed
4. Update navigation in BaseLayout.astro
5. Add documentation in `llm-docs/`

## 📖 Documentation

- **Architecture**: `llm-docs/architecture/system_main_components.md`
- **Implementation Plan**: `llm-docs/features/regex/implementation_plan.md`
- **Technical Details**: `llm-docs/features/regex/technical.md`
- **UI Design**: `llm-docs/features/regex/ui.md`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Astro](https://astro.build)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Heroicons](https://heroicons.com)

---

Made with ❤️ by [Osimify](https://osimify.com)