import api from "./api";

export const createVivaSession = async (sessionData) => {
  const response = await api.post(
    "/viva-sessions",
    sessionData
  );

  return response.data;
};

export const getVivaSession = async (id) => {
  const response = await api.get(
    `/viva-sessions/${id}`
  );

  return response.data;
};