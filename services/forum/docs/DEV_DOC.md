The tool we'll be using for python packages and versioning is `uv`  
https://github.com/astral-sh/uv

## Setup
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
cd services/forum
```

## Versioning
`uv python install`
uv will detect a `.python-version` file in the repo and use that version.

Run `uv run python --version`
it should be `Python 3.13.11`   


## uv CRUD Commands
### Create
* `uv init` — Initialize a new project with a `pyproject.toml`
* `uv add <package>` — Add a new package to `pyproject.toml` and install it
* `uv add --dev <package>` — Add a development dependency

### Read
* `uv tree` — List all installed packages and their dependency tree
* `uv pip list` — List packages in the current environment
* `uv python list` — List available and installed Python versions
* `uv pip show <package>` — View package information

### Update
* `uv lock --upgrade` — Update all packages to their latest compatible versions (updates `uv.lock`)
* `uv add <package>@latest` — Update a specific package to the latest version
* `uv pip install --upgrade <package>` — Standard pip-style upgrade

### Delete
* `uv remove <package>` — Remove a package from the project
* `uv python uninstall <version>` — Remove a managed Python version

### Additional Useful Commands
* `uv sync` — Install all dependencies from `uv.lock` (equivalent to `npm install`)
* `uv run <command>` — Run a command within the project's virtual environment
* `uv venv` — Manually create a virtual environment (though `uv run` handles this automatically)

---

### Key Comparison Table
| Feature | npm / nvm | uv |
| --- | --- | --- |
| **Version File** | `.nvmrc` | `.python-version` |
| **Metadata File** | `package.json` | `pyproject.toml` |
| **Lockfile** | `package-lock.json` | `uv.lock` |
| **Install All** | `npm install` | `uv sync` |
| **Run Scripts** | `npm run <name>` | `uv run <name>` |
| **Environment** | `node_modules/` | `.venv/` |
