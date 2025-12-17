export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData) => {
      const response = await authApi.updateProfile(profileData);
      return response;
    },
    onSuccess: (data) => {
      if (!data) return;

      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      const updatedUser = data?.data?.user || data?.data?.data?.user || data?.user || data;
      if (updatedUser && (updatedUser._id || updatedUser.id)) {
        queryClient.setQueryData(['auth', 'user'], updatedUser);
        queryClient.setQueryData(['profile'], updatedUser);
        queryClient.setQueryData(['user'], updatedUser);
      }
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
};export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData) => {
      const response = await authApi.changePassword(passwordData);
      return response;
    },
    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });
};export const useResetPin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pinData) => {
      const response = await authApi.resetPin(pinData);
      return response;
    },
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      console.error('PIN reset failed:', error);
    },
  });
};export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageAsset) => {

      const formData = new FormData();

      const uri = imageAsset.uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const fileObject = {
        uri: Platform.OS === 'ios' ? uri.replace('file:
        name: filename || 'photo.jpg',
        type: type,
      };

      formData.append('photo', fileObject);

      const response = await authApi.uploadAvatar(formData);
      return response;
    },
    onSuccess: (data) => {
      if (!data) return;

      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      const updatedUser = data?.data?.user || data?.data?.data?.user || data?.user || data;
      if (updatedUser && (updatedUser._id || updatedUser.id)) {
        queryClient.setQueryData(['auth', 'user'], updatedUser);
        queryClient.setQueryData(['profile'], updatedUser);
        queryClient.setQueryData(['user'], updatedUser);
      }
    },
    onError: (error) => {
      console.error('Avatar upload failed:', error);
    },
  });
};


