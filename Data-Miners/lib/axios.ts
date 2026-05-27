import Axios from "axios"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

const axios = Axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
  timeout: 10000,
  withCredentials: true,
})

// Automatically send XSRF-TOKEN cookie as X-XSRF-TOKEN header
axios.interceptors.request.use((config) => {
  if (typeof document === "undefined") {
    return config
  }

  const xsrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1]
  
  if (xsrfToken) {
    config.headers.set("X-XSRF-TOKEN", decodeURIComponent(xsrfToken))
  }
  
  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Axios Request]", config.method?.toUpperCase(), config.url)
  }
  
  return config
})

axios.interceptors.response.use(
  (response) => {
    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Axios Response]", response.config.url, response.status)
    }
    return response
  },
  (error) => {
    // Always log errors, but with less detail in production
    if (process.env.NODE_ENV === "development") {
      console.error("[Axios Error]", error.config?.url, error.response?.status, error.message)
    } else {
      console.error("[Axios Error]", error.response?.status || "Network Error")
    }
    return Promise.reject(error)
  }
)

export default axios
