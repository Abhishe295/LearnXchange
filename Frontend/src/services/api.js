import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:6550";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});