import WebSocket from "ws";
import queryString from "query-string";
import { Express, Request } from "express";

export async function webSocketExample(expressServer: Express) {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: "/",
  });

  // @ts-ignore
  expressServer.on("upgrade", (request, socket, head) => {
    console.log('upgrade', request, head);
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  websocketServer.on(
    "connection",
    function connection(websocketConnection, connectionRequest) {
      // @ts-ignore
      const [_path, params] = connectionRequest?.url?.split("?");
      const connectionParams = queryString.parse(params);

      // NOTE: connectParams are not used here but good to understand how to get
      // to them if you need to pass data with the connection to identify it (e.g., a userId).
      console.log('Connection params', connectionParams);

      websocketConnection.on("message", (message) => {
        // @ts-ignore
        const parsedMessage = JSON.parse(message);
        console.log(parsedMessage);
        websocketConnection.send(JSON.stringify({ message: 'There be gold in them thar hills.' }));
      });
    }
  );

  return websocketServer;
};