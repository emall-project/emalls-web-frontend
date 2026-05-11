import { api } from "../../services/api";


const BASE_PATH = "/api/malls"; 

export async function getMallsPagination(params = {}) {
  const { data } = await api.get(`${BASE_PATH}`, { params });
  return data;
}
export async function getMallsList(params = {}) {
  const { data } = await api.get(`${BASE_PATH}`, {
    params: { page: 0, size: 100, ...params },
  });
  return data;
}

export async function getMallById(id) {
  const { data } = await api.get(`${BASE_PATH}/${id}`);
  return data;
}

export async function createMall(payload) {
  const { data } = await api.post(`${BASE_PATH}`, payload);
  return data;
}

export async function updateMall(payload) {
  const { data } = await api.put(`${BASE_PATH}`, payload);
  return data;
}

export async function changeMallStatus(id, status) {
  const { data } = await api.put(`${BASE_PATH}/${id}/status`, null, {
    params: { status },
  });
  return data;
}

export async function activateMall(id) {
  const { data } = await api.put(`${BASE_PATH}/${id}/activate`);
  return data;
}

export async function deactivateMall(id) {
  const { data } = await api.put(`${BASE_PATH}/${id}/deactivate`);
  return data;
}
