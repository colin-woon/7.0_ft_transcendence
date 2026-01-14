# Versioning 
`nvm use`
it will detect .nvmrc and use the correct version of node
if no nvm, install nvm

## Development scripts (refer to package.json "scripts":)
- `npm run dev` - Run the development server
- `npm run build` - Build the project for production
- `npm run start` - Runs the production-built application. Use this after running build.
- `npm run lint` - check code quality and catch potential issues without fixing them (like norminette)
- `npm run format` - automatically format your code according to project standards.
- `npm run test` - Run tests

## npm CRUD Commands
### Create
- `npm init` - Initialize a new package.json file
- `npm install <package>` - Add a new package to your project
- `npm install <package> --save-dev` - Add a dev dependency

### Read
- `npm list` - List all installed packages
- `npm list --global` - List globally installed packages
- `npm view <package>` - View package information from npm registry
- `npm search <keyword>` - Search for packages

- ### Update
- `npm update` - Update all packages to their latest compatible versions
- `npm update <package>` - Update a specific package
- `npm install <package>@latest` - Install the latest version of a package

- ### Delete
- `npm uninstall <package>` - Remove a package from your project
- `npm uninstall <package> --global` - Remove a globally installed package
- `npm prune` - Remove packages not listed in package.json

- ### Additional Useful Commands
- `npm install` - Install all dependencies from package.json
- `npm ci` - Clean install (recommended for CI/CD environments)
- `npm outdated` - Show packages that have newer versions available

