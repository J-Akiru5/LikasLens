# GitHub MCP Setup Guide

## Overview
The GitHub Model Context Protocol (MCP) server enables VS Code to interact with GitHub directly, allowing you to:
- Manage repositories
- Create and manage issues and pull requests
- Access GitHub API through natural language
- Automate GitHub workflows

## Setup Steps

### 1. Create a GitHub Personal Access Token (PAT)

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name it: `LikasLens-MCP`
4. Select the following scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `read:user` (read user profile data)
   - ✅ `read:org` (read organization data)
   - ✅ `workflow` (update GitHub Action workflows)
   - ✅ `gist` (create gists)
   - ✅ `notifications` (read notifications)

5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### 2. Configure Your Local Environment

1. Open `.mcp/.env.local` in VS Code
2. Replace `your_token_here` with your actual GitHub PAT:
   ```
   GITHUB_TOKEN=ghp_your_actual_token_here
   ```
3. **IMPORTANT**: Never commit this file to Git. It's listed in `.gitignore`

### 3. Verify MCP Configuration

The following files have been created:
- `.mcp/servers.json` - Defines the GitHub MCP server configuration
- `.mcp/.env.local` - Stores your GitHub token (DO NOT COMMIT)
- `.vscode/settings.json` - VS Code settings for MCP integration

### 4. Test the Connection

1. Restart VS Code (Ctrl+Shift+P → "Developer: Reload Window")
2. Open the integrated terminal
3. Run: `echo $env:GITHUB_TOKEN` (PowerShell)
4. You should see your token displayed (if it's properly sourced)

### 5. Using GitHub MCP

Once configured, you can use GitHub MCP through:

**VS Code Command Palette:**
- Press Ctrl+Shift+P
- Type "GitHub" to see available commands

**API Access:**
- Use the MCP to query repositories, create issues, manage PRs
- Ask about your GitHub projects and repositories

**Example Operations:**
- Search for issues/PRs
- Create pull requests programmatically
- Update repository settings
- Manage GitHub workflows
- Create and manage GitHub Actions

## Troubleshooting

### Token Not Found
- Ensure `.mcp/.env.local` exists and contains your token
- VS Code needs to be restarted after adding the token
- Check that `GITHUB_TOKEN` environment variable is set

### Connection Failed
- Verify your token has the correct scopes
- Check that your PAT hasn't expired
- Ensure you're connected to the internet
- Try regenerating a new token if issues persist

### MCP Server Not Starting
- Check VS Code's "Output" panel for MCP logs
- View Remote Explorer to see connected MCP servers
- Restart VS Code: Ctrl+Shift+P → "Developer: Reload Window"

## Security Best Practices

⚠️ **DO NOT:**
- Commit `.mcp/.env.local` to Git
- Share your GitHub token with anyone
- Use a token with unnecessary permissions
- Leave your token in plaintext outside `.mcp/.env.local`

✅ **DO:**
- Regularly rotate your tokens (GitHub recommends every 90 days)
- Use token expiration dates when creating PATs
- Store tokens only in `.env.local` files
- Review token scope permissions regularly

## Next Steps

1. Add your GitHub token to `.mcp/.env.local`
2. Restart VS Code
3. Test GitHub MCP commands through the command palette
4. Explore GitHub actions available in your workspace

For more information, see:
- [GitHub MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [GitHub PAT Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
