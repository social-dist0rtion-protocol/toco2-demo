const server = "http://192.168.0.11:5000";

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const get = (url: string) =>
  fetch(`${server}${url}`, { method: "GET", headers });

export const login = () => {};

export const getStatus = () => get("/api/status");
