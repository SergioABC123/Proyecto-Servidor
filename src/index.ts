import { createApp } from "./app";
import { setSchema } from "./database/dgraph";
import { mongodbConection } from "./database/mongo";

const port = process.env.PORT || 3000;

async function main() {
  try {
    await setSchema();
  } catch (err) {
    console.error("No se pudo aplicar el schema", err);
    process.exit(1);
  }

  await mongodbConection();

  const app = createApp();

  app.listen(port, () => {
    console.log(`app is running in port ${port}`);
  });
}

main();