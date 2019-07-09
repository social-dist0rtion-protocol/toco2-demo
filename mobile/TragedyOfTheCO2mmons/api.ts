import fetch_polyfill from "react-native-fetch-polyfill";

const REQUEST_TIMEOUT = 10 * 1000;
export const defaultServer = "https://d7110f04.eu.ngrok.io"; // local "http://192.168.0.11:5000";

let auth = "";
let server = defaultServer;

export const setJwt = (jwt: string) => {
  auth = jwt;
};

export const setServer = (newServer: string) => {
  server = newServer;
};

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const get = (
  url: string,
  authenticated: boolean = false,
  externalServer: boolean = false
) => {
  const headers = authenticated
    ? { ...defaultHeaders, Authorization: `Bearer ${auth}` }
    : defaultHeaders;
  return fetch_polyfill(externalServer ? url : `${server}${url}`, {
    method: "GET",
    timeout: REQUEST_TIMEOUT,
    headers
  });
};

const post = (url: string, body: any, authenticated: boolean = false) => {
  const headers = authenticated
    ? { ...defaultHeaders, Authorization: `Bearer ${auth}` }
    : defaultHeaders;
  return fetch_polyfill(`${server}${url}`, {
    method: "POST",
    body: JSON.stringify(body),
    timeout: REQUEST_TIMEOUT,
    headers
  });
};

const fetchJson = async (call: () => Promise<Response>) => {
  const response = await call();
  const json = await response.json();
  return json;
};

export const login = async (pushToken: string, name: string, avatar: string) =>
  fetchJson(() => post("/api/signup", { pushToken, name, avatar }));

export const getStatus = async () => fetchJson(() => get("/api/status", true));

export const getRandomAvatar = async () =>
  fetchJson(() => get("https://dog.ceo/api/breeds/image/random", false, true));

export const getPlayerList = async () => fetchJson(() => get("/api/players"));

export const trade = async (to: string) =>
  fetchJson(() => post(`/api/trade?to=${to}`, {}, true));

export const confirmTx = async (txId: string) =>
  fetchJson(() => post(`/api/confirm/${txId}`, {}, true));

export const plantTrees = async (quantity: number) =>
  fetchJson(() => post(`/api/plant/${quantity}`, {}, true));

export const getPendingTransactions = async () =>
  fetchJson(() => get("/api/pending", true));
