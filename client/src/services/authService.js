import api from "./api";

export const login = (data) => {
    return api.post("/auth/login", data);
};

export const forgotPassword = (email) => {
    return api.post("/auth/forgot-password", email);
};