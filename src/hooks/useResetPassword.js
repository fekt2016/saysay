export const useResetPasswordByToken = () => {
  return useMutation({
    mutationFn: async ({ token, newPassword }) => {
      const response = await api.patch(`/users/reset-password/${token}`, {
        newPassword,
      });
      return response.data;
    },
  });
};


