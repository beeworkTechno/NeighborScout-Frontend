import API from "./api";

// REGISTER
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

// LOGIN
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};