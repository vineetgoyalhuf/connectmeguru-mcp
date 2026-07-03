# ConnectMeGuru MCP Server

An official [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for ConnectMeGuru eSIM travel plans and wallet operations. This server allows AI assistants (like Claude, Cursor, and VS Code) to search active international eSIM data catalogs, check balances, apply coupons, and securely buy eSIMs directly inside the chat.

## 🚀 Quick Start (Remote Gateway - Option A)

You do not need to install any packages locally to use this server. You can connect directly to the public remote gateway.

Add the following to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "connectmeguru": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://www.connectmeguru.com/api/mcp"
      ]
    }
  }
}
```

*Restart Claude Desktop after saving the configuration.*

---

## 🛠️ Local Installation (Option B)

If you prefer to run the MCP server locally on your machine:

### 1. Configure configuration file
Add this server to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "connectmeguru": {
      "command": "npx",
      "args": [
        "-y",
        "connectmeguru-mcp"
      ]
    }
  }
}
```

---

## 🔑 Available Tools

### 1. Catalog Search
* **`get_esim_catalog`**: Search eSIM data packages by destination or keyword (e.g. `Japan`, `USA 10GB`, `Europe 30 Days`).

### 2. Coupon Validation
* **`validate_coupon`**: Verify discount coupon codes (e.g. `WELCOME10`).

### 3. Session & Wallet Operations (Requires OTP Authentication)
* **`send_agent_otp`**: Send login code to your email.
* **`verify_agent_otp`**: Complete login and receive secure session token.
* **`get_wallet_balance`**: Check pre-funded USD balance.
* **`purchase_esim_with_wallet`**: Buy eSIM directly in chat.
* **`get_user_orders`**: Retrieve complete order history and installation QR codes.
* **`refresh_esim_usage`**: Get real-time data usage from the network carrier.
* **`cancel_order`**: Request refund for eligible unused orders.
* **`get_topup_packages`**: Check eligible top-up plans.
* **`purchase_topup`**: Complete in-chat eSIM top-up.

---

## 📄 License
MIT License. Created by ConnectMeGuru.
