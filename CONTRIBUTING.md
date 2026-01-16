# Contributing to NEAR Cursor Helper

Thank you for your interest in contributing to the NEAR Cursor Helper! We want to make it as easy as possible to contribute to this project.

## Development Setup

1. **Prerequisites**
   - [Node.js](https://nodejs.org/) (v16 or higher)
   - [Rust](https://www.rust-lang.org/) (with `wasm32-unknown-unknown` target)
   - [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.sh/)

2. **Installation**
   ```bash
   git clone https://github.com/astrix-05/near_cursor_helper.git
   cd near_cursor_helper
   npm install
   ```

3. **Running the Extension**
   - Open the project in VS Code or Cursor.
   - Press `F5` or go to **Run and Debug** and select **Run Extension**.
   - A new window (Extension Development Host) will open where you can test the extension.

## Project Structure

- `src/extension.ts`: Main entry point and command registration.
- `src/diagnostics.ts`: Logic for parsing Cargo JSON output and creating VS Code diagnostics.
- `src/templates/`: Contains the boilerplate files for new NEAR Rust contracts.

## How to Contribute

1. **Reporting Bugs**
   - Open an issue on GitHub.
   - Describe the bug, steps to reproduce, and expected behavior.

2. **Suggesting Features**
   - Open an issue or start a discussion.
   - Explain the feature and how it benefits NEAR developers.

3. **Pull Requests**
   - Fork the repository.
   - Create a new branch: `git checkout -b feature/my-new-feature` or `git checkout -b fix/bug-fix`.
   - Make your changes and commit them.
   - Push to your fork and submit a Pull Request.

## Coding Standards

- Use TypeScript.
- Follow the existing code style (Prettier/ESLint).
- Add comments for complex logic.
- Ensure `npm run compile` succeeds without errors.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
