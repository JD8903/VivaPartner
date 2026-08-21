import api from "./api";

export const saveStudyMaterial = async (materialData) => {
  const response = await api.post("/study-material", materialData);
  return response.data;
};

export const saveStudyTopic = async (materialData) => {
  const response = await api.post("/study-material/topic", materialData);
  return response.data;
};

export const getStudyMaterials = async (vivaSessionId) => {
  const response = await api.get(
    `/study-material/session/${vivaSessionId}`
  );
  return response.data;
};

export const getStudyMaterialsByConfig = async (configId) => {
  const response = await api.get(
    `/study-material/config/${configId}`
  );
  return response.data;
};

export const getStudyMaterial = async (id) => {
  const response = await api.get(`/study-material/${id}`);
  return response.data;
};

export const deleteStudyMaterial = async (id) => {
  const response = await api.delete(`/study-material/${id}`);
  return response.data;
};
