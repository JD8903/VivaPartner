import api from "./api";

// ==========================================
// CREATE VIVA CONFIGURATION
// ==========================================

export const createVivaConfiguration = async (
  configurationData
) => {
  const response = await api.post(
    "/viva/configure",
    configurationData
  );

  return response.data;
};

// ==========================================
// GET VIVA CONFIGURATION
// ==========================================

export const getVivaConfiguration = async (
  id
) => {
  const response = await api.get(
    `/viva/configure/${id}`
  );

  return response.data;
};

// ==========================================
// UPDATE VIVA CONFIGURATION
// ==========================================

export const updateVivaConfiguration = async (
  id,
  configurationData
) => {
  const response = await api.put(
    `/viva/configure/${id}`,
    configurationData
  );

  return response.data;
};

// ==========================================
// DELETE VIVA CONFIGURATION
// ==========================================

export const deleteVivaConfiguration = async (
  id
) => {
  const response = await api.delete(
    `/viva/configure/${id}`
  );

  return response.data;
};