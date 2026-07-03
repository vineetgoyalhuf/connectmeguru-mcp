import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

dotenv.config();

const API_URL = (process.env.CONNECTMEGURU_API_URL || "https://www.connectmeguru.com").replace(/\/$/, "");
const AGGREGATOR_KEY = process.env.CONNECTMEGURU_AGGREGATOR_KEY || "cmg_agg_4b7790f676dca02aee79e5ac3feb1872d4ed134751c838f5";

const server = new Server(
  {
    name: "connectmeguru-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS = [
  {
    name: "get_esim_catalog",
    description: "Queries active international travel eSIM data plans. Optionally filter by country code (e.g. JP, US, FR) or search query.",
    inputSchema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Destination name, country code, or query keywords to refine results (e.g. JP, Japan, Japan 100MB, Europe 10GB, USA 30 Days).",
        },
      },
      required: ["country"],
    },
  },
  {
    name: "get_knowledge_base",
    description: "Retrieves the official ConnectMeGuru grounding knowledge base, including installation guides, device compatibility, refund policies, and support escalation workflows.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "validate_coupon",
    description: "Validates a discount coupon code for checkout. Note: User login is mandatory to validate a coupon. If this returns a 401 Unauthorized error, inform the user that they must log in (using send_agent_otp) first.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The coupon code to validate (e.g. WELCOME10).",
        },
        packageCode: {
          type: "string",
          description: "The eSIM package code to check applicability for.",
        },
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
      },
      required: ["code", "packageCode", "token"],
    },
  },
  {
    name: "get_checkout_url",
    description: "Generates a secure checkout and purchase link for a specific eSIM package.",
    inputSchema: {
      type: "object",
      properties: {
        packageCode: {
          type: "string",
          description: "The package code of the eSIM (e.g. PIK0SW14Q).",
        },
        discountCode: {
          type: "string",
          description: "Optional coupon code to pre-apply (e.g. WELCOME10).",
        },
      },
      required: ["packageCode"],
    },
  },
  {
    name: "send_agent_otp",
    description: "Sends a 6-digit OTP code to the customer's email address for in-chat authentication.",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "The email address of the customer.",
        },
      },
      required: ["email"],
    },
  },
  {
    name: "verify_agent_otp",
    description: "Verifies the email OTP code and returns a session token for wallet purchases.",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "The email address of the customer.",
        },
        code: {
          type: "string",
          description: "The 6-digit OTP code entered by the user.",
        },
      },
      required: ["email", "code"],
    },
  },
  {
    name: "get_wallet_balance",
    description: "Retrieves the user's current pre-funded wallet balance. Requires a valid session token.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "purchase_esim_with_wallet",
    description: "Purchases an eSIM package directly in chat using the user's wallet balance. If balance is insufficient, returns a magic link to top-up.",
    inputSchema: {
      type: "object",
      properties: {
        packageCode: {
          type: "string",
          description: "The package code of the eSIM (e.g. PIK0SW14Q).",
        },
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
        discountCode: {
          type: "string",
          description: "Optional coupon code (e.g. WELCOME10).",
        },
      },
      required: ["packageCode", "token"],
    },
  },
  {
    name: "cancel_order",
    description: "Cancels an eligible eSIM order before activation/provisioning. Requires a valid session token.",
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "The ID of the order to cancel.",
        },
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
      },
      required: ["orderId", "token"],
    },
  },
  {
    name: "refresh_esim_usage",
    description: "Requests a real-time data usage update for an active eSIM from the carrier. Requires a valid session token.",
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "The ID of the eSIM order.",
        },
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
      },
      required: ["orderId", "token"],
    },
  },
  {
    name: "get_wallet_transactions",
    description: "Retrieves a paginated list of wallet transaction history. Requires a valid session token.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
        page: {
          type: "number",
          description: "Optional page number (defaults to 1).",
        },
        limit: {
          type: "number",
          description: "Optional number of items per page (defaults to 20).",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "get_topup_packages",
    description: "Retrieves compatible top-up data packages for an active eSIM. Requires a valid session token.",
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "The ID of the active eSIM order.",
        },
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
      },
      required: ["orderId", "token"],
    },
  },
  {
    name: "purchase_topup",
    description: "Purchases a compatible top-up package using the wallet balance. Requires a valid session token.",
    inputSchema: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "The ID of the active eSIM order.",
        },
        packageCode: {
          type: "string",
          description: "The top-up package code to purchase.",
        },
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
      },
      required: ["orderId", "packageCode", "token"],
    },
  },
  {
    name: "get_user_orders",
    description: "Retrieves a paginated list of the authenticated user's eSIM orders and history. Requires a valid session token.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The secure session token returned by verify_agent_otp.",
        },
        page: {
          type: "number",
          description: "Optional page number (defaults to 1).",
        },
        limit: {
          type: "number",
          description: "Optional number of orders per page (defaults to 20).",
        },
      },
      required: ["token"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_esim_catalog") {
      const countryArg = String(args?.country || "");
      const cleanCountry = countryArg.trim().toLowerCase();

      let targetUrl = `${API_URL}/api/products/search`;
      const hasFilter = cleanCountry && cleanCountry !== "all" && !cleanCountry.includes("full") && !cleanCountry.includes("no filter");

      if (hasFilter) {
        targetUrl += `?country=${encodeURIComponent(countryArg)}`;
      }

      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data: any = await res.json();

      if (!data.success || !data.plans || data.plans.length === 0) {
        return {
          content: [{ type: "text", text: `No active eSIM packages found matching "${countryArg}".` }],
        };
      }

      const selectedPlans = data.plans;
      const totalCount = data.totalCount;

      let output = "";
      if (!hasFilter) {
        output += `### 10 Featured eSIM Plans:\n\n`;
      } else {
        output += `### 10 eSIM Plans for "${countryArg}" (out of ${totalCount} matching plans):\n\n`;
      }

      output += `| Code | Plan Name | Data | Duration | Price | Locations |\n`;
      output += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      selectedPlans.forEach((p: any) => {
        const priceStr = `$${p.retailPrice.toFixed(2)} USD`;
        output += `| ${p.packageCode} | ${p.name} | ${p.dataAmount} ${p.dataUnit} | ${p.duration} Days | ${priceStr} | ${p.locationNames?.slice(0, 3).join(", ")} |\n`;
      });

      output += `\n\n`;
      if (!hasFilter) {
        output += `*Note: There are ${totalCount} total plans. To see plans for a specific country, please search by country name (e.g., "Japan", "USA", "Spain").*`;
      } else if (totalCount > 10) {
        output += `*Note: Showing a random selection of 10 plans out of ${totalCount} matching plans. To narrow these down, you can specify your preferences (e.g. "10GB data", "30 days", or "under $20").*`;
      }

      return { content: [{ type: "text", text: output }] };
    }

    if (name === "get_knowledge_base") {
      const res = await fetch(`${API_URL}/api/mcp/knowledge`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data: any = await res.json();
      return { content: [{ type: "text", text: data.content || data.error }] };
    }

    if (name === "validate_coupon") {
      const { code, packageCode, token } = args as any;
      const res = await fetch(`${API_URL}/api/discount/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ code, packageCode }),
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Coupon validation failed: ${data.error || "Invalid code"}` }] };
      }
      return {
        content: [
          {
            type: "text",
            text: `Coupon code "${code}" is valid! Discount: $${data.discount.toFixed(2)} USD, Final price: $${data.finalPrice.toFixed(2)} USD.`,
          },
        ],
      };
    }

    if (name === "get_checkout_url") {
      const { packageCode, discountCode } = args as any;
      let checkoutUrl = `${API_URL}/checkout?plan=${encodeURIComponent(packageCode)}`;
      if (discountCode) checkoutUrl += `&discount=${encodeURIComponent(discountCode)}`;

      let text = `Here is your direct, secure checkout link for **${packageCode}**:\n\n`;
      text += `👉 [Secure Checkout - ${packageCode}](${checkoutUrl})\n\n`;
      text += `*Note: Click this link to open the pre-filled checkout flow on ConnectMeGuru. Once logged in, you can complete the purchase securely.*`;
      return { content: [{ type: "text", text }] };
    }

    if (name === "send_agent_otp") {
      const { email } = args as any;
      const res = await fetch(`${API_URL}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Error: Failed to send OTP: ${data.error}` }] };
      }
      return {
        content: [
          {
            type: "text",
            text: `Success: A 6-digit verification code has been sent to your email **${email}**. Please enter it using verify_agent_otp to complete login.`,
          },
        ],
      };
    }

    if (name === "verify_agent_otp") {
      const { email, code } = args as any;
      const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Error: Verification failed: ${data.error}` }] };
      }

      let text = `🎉 **Successfully Logged In!**\n\n`;
      text += `Your session token is:\n\`\`\`\n${data.token}\n\`\`\`\n\n`;
      text += `*Note: I will remember this token for the rest of our chat to perform wallet operations.*`;
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_wallet_balance") {
      const { token } = args as any;
      const res = await fetch(`${API_URL}/api/wallet/balance`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Error: ${data.error}` }] };
      }
      return {
        content: [{ type: "text", text: `Your current ConnectMeGuru wallet balance is **$${data.balance.toFixed(2)} USD**.` }],
      };
    }

    if (name === "purchase_esim_with_wallet") {
      const { packageCode, discountCode, token } = args as any;
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ packageCode, discountCode }),
      });
      const data: any = await res.json();

      if (res.ok && (data.status === "SUCCESS" || data.status === "COMPLETED" || data.status === "PROCESSING")) {
        let text = `✅ **eSIM Purchased Successfully!**\n\n`;
        text += `* **Order ID**: \`${data.orderId}\`\n`;
        text += `* **ICCID**: \`${data.iccid}\`\n`;
        text += `* **SM-DP+ Address**: \`${data.smdpAddress}\`\n`;
        text += `* **Matching ID / Activation Code**: \`${data.matchingId}\`\n\n`;
        
        if (data.smdpAddress && data.matchingId) {
          text += `### 📱 Direct Mobile Installation:\n`;
          text += `👉 [Install eSIM Directly on Phone](${data.lpaUrl || `LPA:1$${data.smdpAddress}$${data.matchingId}`})\n\n`;
        }
        if (data.qrCode) {
          text += `### 📸 QR Code Activation:\n`;
          text += `![eSIM Activation QR Code](${data.qrCode})\n`;
        }
        return { content: [{ type: "text", text }] };
      }

      if (data.error && data.error.includes("Insufficient wallet balance")) {
        return { content: [{ type: "text", text: `⚠️ **Insufficient Wallet Balance**: ${data.error}` }] };
      }

      return { content: [{ type: "text", text: `Failed to purchase eSIM: ${data.error || "Unknown error"}` }] };
    }

    if (name === "cancel_order") {
      const { orderId, token } = args as any;
      const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Failed to cancel order: ${data.error || "Unknown error"}` }] };
      }
      return { content: [{ type: "text", text: `✅ **Order Cancelled Successfully!** Refund has been credited to your wallet.` }] };
    }

    if (name === "refresh_esim_usage") {
      const { orderId, token } = args as any;
      const res = await fetch(`${API_URL}/api/esims/${orderId}/usage`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Failed to sync usage: ${data.error || "Unknown error"}` }] };
      }
      return { content: [{ type: "text", text: `📊 **eSIM Usage Synced**: ${data.usedVolumeFormatted || "updated successfully"}.` }] };
    }

    if (name === "get_wallet_transactions") {
      const { token, page = 1, limit = 20 } = args as any;
      const res = await fetch(`${API_URL}/api/wallet/transactions?page=${page}&limit=${limit}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Failed to load transactions: ${data.error || "Unknown error"}` }] };
      }

      let output = `### Recent Wallet Transactions:\n\n`;
      output += `| Date | Type | Amount | Balance | Description |\n`;
      output += `| :--- | :--- | :--- | :--- | :--- |\n`;
      data.transactions.forEach((t: any) => {
        output += `| ${new Date(t.createdAt).toLocaleDateString()} | **${t.type}** | $${t.amount.toFixed(2)} | $${t.balanceAfter.toFixed(2)} | ${t.description} |\n`;
      });
      return { content: [{ type: "text", text: output }] };
    }

    if (name === "get_topup_packages") {
      const { orderId, token } = args as any;
      const res = await fetch(`${API_URL}/api/esims/${orderId}/topup`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Failed to get top-up options: ${data.error || "Unknown error"}` }] };
      }

      let output = `### Compatible Top-up Packages:\n\n`;
      output += `| Code | Name | Data | Duration | Price |\n`;
      output += `| :--- | :--- | :--- | :--- | :--- |\n`;
      data.packages.forEach((pkg: any) => {
        output += `| ${pkg.packageCode} | ${pkg.name} | ${pkg.dataAmount} ${pkg.dataUnit} | ${pkg.duration} Days | $${pkg.retailPrice.toFixed(2)} USD |\n`;
      });
      return { content: [{ type: "text", text: output }] };
    }

    if (name === "purchase_topup") {
      const { orderId, packageCode, token } = args as any;
      const res = await fetch(`${API_URL}/api/esims/${orderId}/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ packageCode }),
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Failed to purchase top-up: ${data.error || "Unknown error"}` }] };
      }
      return { content: [{ type: "text", text: `✅ **Top-up Purchased Successfully!** eSIM has been updated.` }] };
    }

    if (name === "get_user_orders") {
      const { token, page, limit } = args as any;
      const currentPage = page || 1;
      const currentLimit = limit || 20;
      const res = await fetch(`${API_URL}/api/orders?page=${currentPage}&limit=${currentLimit}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data: any = await res.json();
      if (!res.ok || data.error) {
        return { content: [{ type: "text", text: `Failed to load orders: ${data.error || "Unknown error"}` }] };
      }

      let output = `### Your eSIM Orders:\n\n`;
      data.orders.forEach((o: any) => {
        const dateStr = new Date(o.createdAt).toLocaleDateString();
        output += `#### 📦 Order \`${o.id}\` (${dateStr}) - **${o.status}**\n`;
        output += `* **Plan**: ${o.product?.name || "eSIM"}\n`;
        if (o.iccid) output += `* **ICCID**: \`${o.iccid}\`\n`;
        if (o.smdpAddress) output += `* **SM-DP+ Address**: \`${o.smdpAddress}\`\n`;
        if (o.matchingId) output += `* **Activation Code / Matching ID**: \`${o.matchingId}\`\n`;
        
        const lpaUrl = o.smdpAddress && o.matchingId ? `LPA:1$${o.smdpAddress}$${o.matchingId}` : null;
        if (lpaUrl) {
          output += `* **Direct Install**: [Install eSIM Directly on Phone](${lpaUrl})\n`;
        }
        if (o.qrCode) {
          output += `* **QR Code**: [View QR Code](${o.qrCode})\n`;
        }
        output += `\n---\n\n`;
      });
      return { content: [{ type: "text", text: output }] };
    }

    throw new Error(`Tool "${name}" is not implemented.`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error executing tool "${name}": ${error.message}` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ConnectMeGuru Standalone MCP Server running on Stdio transport");
}

main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
