# Speed Reader

Minimal speed reader, allows you to insert a PDF file, adjust the interval speed between each word, and improve your reading speed.

Link of the Installer: [Click Here!](https://drive.google.com/file/d/12-F0wheyQfAC_4Yj0op3nFSVMXT0HjYc/view?usp=sharing)

## Features

- Upload and parse PDF files
- Adjust the reading speed interval
- Simple and intuitive user interface
- Dark mode support
- Electron-based desktop application

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/silassequeira/speed-reader.git
   cd speed-reader
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Build the application:

   ```sh
   npm run build
   ```

4. Start the application:
   ```sh
   npm start
   ```

## Usage

1. Launch the application.
2. Click on the "Upload PDF" button to select a PDF file.
3. Adjust the reading speed interval using the provided controls.
4. Start reading and improve your speed!

## Development

### Scripts

- `npm run installserver`: Installs server dependencies.
- `npm run installfrontend`: Installs frontend dependencies.
- `npm run server`: Starts the backend server.
- `npm run viteapp`: Starts the Vite development server for the frontend.
- `npm run frontend`: Opens the frontend in Chrome and runs both the server and Vite app.
- `npm run build`: Builds the frontend.
- `npm run app`: Opens the frontend in Chrome and runs the server.

- `npm run electron`: Starts the Electron application.
- `npm run electronBuild`: Builds the Electron application.
- `npm run electronBuildFrontend`: Builds the frontend for the Electron application.

### Dependencies

- `electron`: Framework for building cross-platform desktop apps.
- `express`: Web framework for Node.js.
- `multer`: Middleware for handling `multipart/form-data`.
- `pdf-parse`: Library for parsing PDF files.
- `cors`: Middleware for enabling CORS.
- `axios`: Promise-based HTTP client for the browser and Node.js.
- `pdfjs-dist`: PDF parsing library.
- `prop-types`: Runtime type checking for React props.
- `react`: JavaScript library for building user interfaces.
- `react-dom`: Entry point to the DOM and server renderers for React.

### DevDependencies

- `electron-builder`: Tool for packaging and building Electron apps.
- `vite`: Next-generation frontend tooling.
- `eslint`: Pluggable JavaScript linter.
- `@vitejs/plugin-react-swc`: Vite plugin for React with SWC.
- `@eslint/js`: ESLint's JavaScript configuration.
- `@types/react`: TypeScript definitions for React.
- `@types/react-dom`: TypeScript definitions for React DOM.
- `eslint-plugin-react-hooks`: ESLint plugin for React hooks.
- `eslint-plugin-react-refresh`: ESLint plugin for React Refresh.
- `globals`: Global variables for ESLint.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Electron](https://www.electronjs.org/)
- [Express](https://expressjs.com/)
- [Multer](https://github.com/expressjs/multer)
- [pdf-parse](https://github.com/modesty/pdf-parse)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
