import express from 'express';
import { webSocketExample } from "./ws";
const app = express();
import cors from "cors";


webSocketExample(app);

app.use(cors());

// app.use(cors({origin: '*'}));

// @ts-ignore
app.use('/', (req, res) => {
  res.send('Hello world');
});

app.listen(3123, () => {
  console.log('Listening on port 3123');
});

