
## Task Runner (Makefile) Commands
- `make` - shows available list of commands with the `help` rule

### Start specific set of services
**The profiles are to prevent the need for running unrelated container instances**
- `make all` — start all services (default profile).
- `make auth` — start only the auth profile.
- `make chat` — start only the chat profile.
- `make forum` — start only the forum profile.
- `make up PROFILE=auth` — start a specific profile.

### Stop services
- `make down PROFILE=auth` — stop only containers for the auth profile.
- `make down PROFILE=all` — stop containers for the all profile.
- `make clean` — stop and remove containers, networks, and volumes.

### Build / Restart / Logs
- `make build PROFILE=forum` — build a specific profile.
- `make restart PROFILE=chat` — restart a specific profile.
- `make logs PROFILE=all` — follow logs for a profile.

### Status / Misc
- `make ps` — list running containers.
- `make stop` — stop all running containers.
- `make pull PROFILE=all` — pull images for a profile.
