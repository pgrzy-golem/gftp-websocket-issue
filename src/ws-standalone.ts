import WebSocket from "ws";
import queryString from "query-string";

async function webSocketExample() {
  const websocketServer = new WebSocket.Server({
    port: 3123,
    path: "/",
  });

  // @ts-ignore
  // expressServer.on("upgrade", (request, socket, head) => {
  //   console.log('upgrade', request, head);
  //   websocketServer.handleUpgrade(request, socket, head, (websocket) => {
  //     websocketServer.emit("connection", websocket, request);
  //   });
  // });

  websocketServer.on(
    "connection",
    function connection(websocketConnection, connectionRequest) {
      console.log('Connection params', connectionRequest);

      websocketConnection.on("message", (message) => {
        // @ts-ignore
        const parsedMessage = JSON.parse(message);
        console.log(parsedMessage);
        websocketConnection.send(JSON.stringify({ message: 'There be gold in them thar hills.' }));
      });
    }
  );

  return websocketServer;
}

webSocketExample().then(() => {
  console.log('Standalone websocket listening on port 3123');
})