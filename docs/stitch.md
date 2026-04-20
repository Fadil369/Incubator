# Stitch Setup

The workspace now includes a tracked MCP configuration at `.vscode/mcp.json` and a manifest-driven export script for the Stitch project `Welcome to Incubation Program`.

## Authentication

The export flow in this workspace uses the Stitch API key directly.

Use this value:

- `STITCH_API_KEY`: your Stitch API key

## VS Code MCP setup

The file `.vscode/mcp.json` uses secure input prompts instead of hardcoding secrets.

1. Start the `stitch` MCP server from VS Code.
2. When prompted for `stitch-api-key`, paste the API key.

## Export the requested screens

Run the export script from the workspace root:

```bash
export STITCH_API_KEY='your-api-key'
npm run stitch:export
```

The script writes files under `output/stitch/welcome-to-incubation-program/`.

For each screen, it saves:

- `screen.json`: normalized Stitch metadata
- `raw-response.json`: raw MCP response for debugging
- `screenshot.*`: downloaded image file when available
- `htmlCode.*`: downloaded code file when available

It also writes `index.json` at the project output root.