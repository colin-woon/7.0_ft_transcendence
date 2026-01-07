The tool we'll be using for java packages and versioning is `SDKMAN`  
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
