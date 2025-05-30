import express from 'express';
import identifyRouter from './routes/identify';
import { setupSwagger } from './swagger/swagger';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
setupSwagger(app);
app.use('/identify', identifyRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
   console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});
