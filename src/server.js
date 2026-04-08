const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/prisma");

async function startServer() {
  try {
    await prisma.$connect();

    const actualPort = process.env.PORT || env.port || 8080;
    
    app.listen(actualPort, '0.0.0.0', () => {
      console.log(`Backend listening on http://localhost:${actualPort}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

startServer();
