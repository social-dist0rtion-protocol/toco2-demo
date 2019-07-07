export const server = "http://192.168.0.11:5000";

let auth = "";

export const setJwt = (jwt: string) => {
  auth = jwt;
};

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const get = (url: string, authenticated: boolean = false) => {
  const headers = authenticated
    ? { ...defaultHeaders, Authorization: `Bearer ${auth}` }
    : defaultHeaders;
  return fetch(`${server}${url}`, { method: "GET", headers });
};

const post = (url: string, body: any, authenticated: boolean = false) => {
  const headers = authenticated
    ? { ...defaultHeaders, Authorization: `Bearer ${auth}` }
    : defaultHeaders;
  return fetch(`${server}${url}`, {
    method: "POST",
    body: JSON.stringify(body),
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

export const trade = async (to: string) =>
  fetchJson(() => post(`/api/trade?to=${to}`, {}, true));
