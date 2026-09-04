# HighLevel MCP Configuration Status

**Date:** 2026-08-28  
**Status:** 🟡 AWAITING OAUTH AUTHENTICATION

---

## MCP Registration

### ✅ MCP Added Successfully

```
Server Name: leadconnector
Transport: HTTP
Endpoint: https://services.leadconnectorhq.com/mcp/anthropic/v2
Configuration File: C:\Users\josia\.claude.json
```

### Current Status

```
leadconnector: https://services.leadconnectorhq.com/mcp/anthropic/v2 (HTTP)
Status: ! Needs authentication
```

---

## Next Steps: OAuth Authentication Required

### How to Complete Authentication

Since this is an HTTP MCP requiring OAuth, you need to authenticate through HighLevel's official OAuth flow:

**Option 1: Via Claude Code IDE Interface (Recommended)**

1. Open Claude Code
2. Look for authentication prompt or MCP settings
3. Click "Authenticate" or "Connect to HighLevel"
4. Browser will open to HighLevel OAuth page
5. Log in with HighLevel account
6. Select Floristería Lucía subcuenta
7. Approve permissions (review carefully)
8. Browser redirects back with authorization token

**Option 2: Manual Configuration (if Option 1 doesn't work)**

1. Visit: https://services.leadconnectorhq.com/auth/oauth
2. Complete HighLevel OAuth flow manually
3. Copy returned authorization token
4. Configure MCP with token via:
   ```
   claude mcp config leadconnector --auth-token <token>
   ```

---

## What Will Happen After OAuth

Once authenticated, the MCP will:

- ✅ Provide access to HighLevel API v3
- ✅ Allow reading opportunities, contacts, pipelines
- ✅ Allow reading webhooks configuration
- ❌ Restrict to approved scopes only (TBD)
- ❌ Prevent unintended modifications

---

## Expected Scopes

Based on HighLevel MCP v2 documentation, likely scopes include:

- `opportunities.read` - Read opportunities
- `contacts.read` - Read contacts
- `pipelines.read` - Read pipelines
- `webhooks.read` - Read webhooks (possibly)
- `webhooks.write` - Create/modify webhooks (possibly)

**IMPORTANT:** Review all requested scopes BEFORE approving.

---

## Subcuenta to Select

When prompted to select which HighLevel account/location:

**Select:** Floristería Lucía  
**Location ID:** vOq7yOWR63XGU4qQ7XWd  
**Do NOT select:** Any other location/subcuenta

---

## After Authentication is Complete

Once you've authenticated:

1. Report back: "OAuth completed"
2. I will verify connection with: `claude mcp list`
3. I will discover available tools: `claude mcp tools leadconnector`
4. I will verify read-only access to HighLevel data
5. I will NOT execute any write operations
6. I will create final status report

---

## Current Limitations

- 🔒 Cannot query HighLevel until authenticated
- 🔒 Cannot discover available tools until authenticated
- 🔒 Cannot verify scopes until authenticated
- ✅ Safe to authenticate (read-only for now)

---

## What I'm NOT Doing (Safety)

- ❌ NOT using existing Private Integration token
- ❌ NOT modifying any webhooks
- ❌ NOT creating workflows
- ❌ NOT modifying pipelines
- ❌ NOT modifying opportunities
- ❌ NOT modifying contacts
- ❌ NOT rotating any tokens
- ❌ NOT making any writes to HighLevel

---

## Status Summary

| Component                | Status                       |
| ------------------------ | ---------------------------- |
| MCP Server Added         | ✅ Yes                       |
| Endpoint Configured      | ✅ Yes                       |
| Connection Status        | 🟡 Awaiting OAuth            |
| Authentication           | 🟡 REQUIRED                  |
| Herramientas disponibles | 🔒 Unknown (blocked on auth) |
| Lectura HL Data          | 🔒 Unknown (blocked on auth) |
| Permisos de escritura    | 🔒 Unknown (blocked on auth) |

---

## Action Required from User

**Complete the OAuth authentication in HighLevel:**

1. Check Claude Code for OAuth prompt
2. Click "Connect" or "Authenticate"
3. Follow browser redirects to HighLevel
4. Log in and select Floristería Lucía
5. Review and approve scopes
6. Report back when complete

---

**Once authenticated, I will verify capabilities and create final status report.**
