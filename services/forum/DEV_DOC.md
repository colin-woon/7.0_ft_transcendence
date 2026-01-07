The tool we'll be using for python packages and versioning is `uv`  
https://github.com/astral-sh/uv

## Setup
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
cd services/forum
uv sync
```

## Running the app
```bash
uv run python <EXECUTABLE_NAME>.py
OR
uv run pytest # if you have tests
uv run python # opens Python REPL in project env
```

## Installing packages
```bash
uv add <PACKAGE_NAME>
OR
uv add --dev <PACKAGE_NAME> # for dev dependencies
```

## Removing packages
```bash
uv remove <PACKAGE_NAME>
```

## Others
```bash
uv tree                    # See a "family tree" of your dependencies
uv lock --upgrade          # Updates all libraries to latest allowed versions
uv cache clean             # Clear space if your disk is getting full
```