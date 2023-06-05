import express from 'express';
import { webSocketExample } from "./ws";
import {readFileSync} from 'node:fs';

const app = express();


// @ts-ignore
app.use('/test-ftp.js', (req, res) => {
  res.send(readFileSync('./src/test-ftp.js', 'utf8'));
})

app.use('/', (req, res) => {
  res.send(readFileSync('./src/index.html', 'utf8'));
})

app.listen(3124, () => {
  console.log('Listening on port 3124');
});

