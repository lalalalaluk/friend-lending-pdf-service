import { Container } from "@cloudflare/containers";

export class PDFServiceContainer extends Container {
  defaultPort = 3001;
  sleepAfter = "10m";

  onStart() {
    console.log("PDF Service container started");
  }

  onStop() {
    console.log("PDF Service container stopped");
  }

  onError(error) {
    console.error("Container error:", error);
  }
}

export default {
  async fetch(request, env) {
    const id = env.PDF_SERVICE.idFromName("pdf-service-v2");
    const stub = env.PDF_SERVICE.get(id);

    // Pass secrets from Worker env into the container
    await stub.startAndWaitForPorts({
      startOptions: {
        envVars: {
          API_KEY: env.API_KEY,
          PDF_ENCRYPTION_SALT: env.PDF_ENCRYPTION_SALT,
          NODE_ENV: env.NODE_ENV || "production",
          LOG_LEVEL: env.LOG_LEVEL || "info",
          PORT: "3001",
        },
      },
    });

    return stub.fetch(request);
  },
};
