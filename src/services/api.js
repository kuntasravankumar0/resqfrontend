import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
});

export const setToken = (token) => {
  if (token) {
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common[
      "Authorization"
    ];
  }
};
