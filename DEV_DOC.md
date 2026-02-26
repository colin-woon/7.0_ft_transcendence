# Developer Workflow

## Environment Setup
1. Make sure to copy the `environment/*.env.examples` into `environment/*.env`
2. In case of changing desired host port, refer to `shared.env`
3. Run `make <profile>` for desired setup, since we're using `docker-compose.override.yml`, you can check the final combined yaml file with `make config`
4. Use `docker logs <container>` to debug if any lauching issues, currently hot reloading is enabled for code editing for all services containers:
   - **Auth/Chat** - Quarkus uses Lazy Reloading which happens when the next HTTP request hits the service.
   - **Forum** - Uvicorn will refresh on file save to any `.py` file
   - **Web** - Next.js updates the browser via WebSockets, code changes are instant (HMR)
5. In the case of adding packages/extensions:
   - **Auth/Chat** - Quarkus uses the Quarkus Dev UI at http://localhost:<PORT>/q/dev. Click "Extensions" to add what you need. On the Bottom-Right corner there is an `+` symbol, you can add extensions there without needing to relaunch the container, it will reflect in `pom.xml`
   - **Forum** - Since the `uv` package manager is installed, you can use the `services/forum/Makefile/` rules to do any package installations, it has been configured to run the `uv` commands in the docker container since `Uvicorn` looks at the changes in `.venv` inside the container, the app will reload as expected without needing to relaunch the container. changes are reflected in `pyproject.toml` and `uv.lock` 
   - **Web** - Next.js needs to restart dev server to detect changes in `package.json` especially if any dependencies uses binaries. So **ensure the container is down first with** `make down`, run `npm install <package>`, then relaunch the container with `make web`(The container bind mounts to the entire `services/web/` directory)

## Folders
- `environments/` - configurable environments seperated by services (shared.env will be used by all services)
- `infra/` - configurable services (no custom code)
- `services/` - custom services (code included)

## Task Runner (Makefile) Commands
- `make` - shows available list of commands with the `help` rule

### Start specific set of services
**The profiles are to prevent the need for running unrelated container instances**
- `make all` — start all services (default profile).
- `make auth` — start only the auth profile.
- `make chat` — start only the chat profile.
- `make forum` — start only the forum profile.
- `make web` — start only the forum profile.

### Stop services
- `make down PROFILE=auth` — stop only containers for the auth profile.
- `make down` — stops all containers (PROFILE=all by default in Makefile).
- `make clean` — stop and remove containers, networks, and volumes.

### Status / Misc
- `make ps` — list running containers.
- `make stop` — stop all running containers.
- `make config` — check combined yaml configuration for docker compose
