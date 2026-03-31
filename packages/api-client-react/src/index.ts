import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("ftth_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const fetcher = async (url: string, options: RequestInit) => {
  const res = await fetch(url, { ...options, headers: getHeaders() });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${res.status}`);
  }
  return res.json();
};

export const useLogin = () => useMutation({
  mutationFn: (variables: { data: any }) => fetcher('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(variables.data)
  })
});

export const useGetMe = () => useQuery({
  queryKey: ['me'],
  queryFn: () => fetcher('/api/auth/me', { method: 'GET' })
});

export const useGetProjects = () => useQuery({
  queryKey: ['projects'],
  queryFn: () => fetcher('/api/projects', { method: 'GET' })
});

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { params: { id: number } }) => fetcher(`/api/projects/${variables.params.id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });
};

export const useGetUsers = () => useQuery({
  queryKey: ['users'],
  queryFn: () => fetcher('/api/users', { method: 'GET' })
});

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { data: any }) => fetcher('/api/users', {
      method: 'POST',
      body: JSON.stringify(variables.data)
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { params: { id: number } }) => fetcher(`/api/users/${variables.params.id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });
};

export const useResetUserDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { params: { id: number } }) => fetcher(`/api/users/${variables.params.id}/reset-device`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });
};
