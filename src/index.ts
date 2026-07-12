import "dotenv/config";
import { createApp } from "./app";
import { setSchema } from "./database/dgraph";
import { mongodbConection } from "./config/mongo.config"; 
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import config from './config/swagger.config';


const port = process.env.PORT || 3000;


const specs = swaggerJSDoc(config);
const app = createApp();


async function main() {
  try {
    await setSchema();
  } catch (err) {
    console.error("No se pudo aplicar el schema", err);
    process.exit(1);
  }

  await mongodbConection();

  const app = createApp();

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  app.listen(port, () => {
    console.log(`app is running in port ${port}`);
  });
}

main();