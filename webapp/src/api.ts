export const defaultServer = "https://31c79c70.eu.ngrok.io"; // local "http://192.168.0.11:5000";

let server = defaultServer;

export const setServer = (newServer: string) => {
  server = newServer;
};

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const get = (url: string, externalServer: boolean = false) =>
  fetch(externalServer ? url : `${server}${url}`, {
    method: "GET",
    headers: defaultHeaders
  });

const fetchJson = async (call: () => Promise<Response>) => {
  const response = await call();
  const json = await response.json();
  return json;
};

export const getStatus = async () => fetchJson(() => get("/api/status"));

export const getPlayerList = async () => fetchJson(() => get("/api/players"));

export const getLeaderboard = async () =>
  fetchJson(() => get("/api/leaderboard"));
