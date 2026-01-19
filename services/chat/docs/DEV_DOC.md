The tool we'll be using for java versioning is `SDKMAN`  
https://sdkman.io/

## Setup
```bash
curl -s "https://get.sdkman.io" | bash
```

## Install tools
```bash
sdk env install
```

## Set default env for your terminal
```bash
sdk env
```

## Enable auto env, to avoid sdk env being reset on every new terminal
```bash
vim ~/.sdkman/etc/config
```
- add `sdkman_auto_env=true`

## Versioning
The Quarkus CLI interacts with your `pom.xml` to manage versions. To see your current environment:
* `quarkus --version` — Display the version of the CLI.
* `java -version` 

---

## Development & Build Commands
These commands replace standard Maven lifecycle calls with Quarkus-optimized workflows.

* `quarkus dev` — Start the live-coding environment (hot reload, Dev UI at `/q/dev`).
* `quarkus test` — Run continuous testing (tests rerun automatically on code changes).
* `quarkus build` — Build the project (runs `mvn package` by default).
* `quarkus build --native` — Build a native executable (requires GraalVM or Docker).
* `quarkus image build docker` — Build a container image using the local Docker daemon.

---

## Quarkus CLI CRUD Commands

### Create
* `quarkus create cli` — Initialize a command-line specific project (with Picocli).
* `quarkus ext add <extension-name>` — Add a Quarkus extension (e.g., `resteasy-jackson`, `hibernate-orm`).

### Read
* `quarkus ext list --installed` — List all extensions currently in your project.
* `quarkus ext list --search <query>` — Search the registry for available extensions.
* `quarkus info` — Display project details, platform versions, and environment info.

### Update
* `quarkus update` — Interactively update project dependencies and Quarkus platform versions.
* `quarkus update --dry-run` — See what would be updated without changing files.

### Delete
* `quarkus ext remove <extension-name>` — Remove an extension from your `pom.xml`.

---

### Key Comparison Table
| Feature | Maven (Standard) | Quarkus CLI | npm |
| --- | --- | --- | --- |
| **New Project** | `mvn archetype:generate ...` | `quarkus create app` | `npm init` |
| **Metadata File** | `pom.xml` | `pom.xml` | `package.json` |
| **Dev Mode** | `./mvnw quarkus:dev` | `quarkus dev` | `npm run dev` |
| **Add Extension** | Edit `pom.xml` manually | `quarkus ext add <name>` | `npm install <name>` |
| **List Extensions** | `mvn dependency:tree` | `quarkus ext list` | `npm list` |
| **Build Artifact** | `mvn package` | `quarkus build` | `npm run build` |
| **Native Build** | `mvn package -Dnative` | `quarkus build --native` | N/A |

---

### Pro-Tip: The Dev UI

When you run `quarkus dev`, you can access the **Dev UI** at `http://localhost:8080/q/dev/`. This provides a visual interface to manage extensions, view configuration, and inspect beans without leaving your browser.

**Would you like me to generate a sample `application.properties` file with common Quarkus configurations for your new project?**
