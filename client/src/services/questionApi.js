import api from "./api";

export const saveQuestionsToDB = async (data) => {
  if (!data) {
    throw new Error("Question data is required.");
  }

  const response = await api.post(
    "/questions/save",
    data
  );

  return response.data;
};