import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import addressApi from '../services/addressApi';
import locationApi from '../services/locationApi';

export const useGetUserAddresses = () => {
  return useQuery({
    queryKey: ["address"],
    queryFn: async () => {
      const res = await addressApi.getUserAddresses();
      return res;
    },
  });
};

export const useGetUserAddress = () => {
  return useQuery({
    queryKey: ["address"],
    queryFn: async () => {
      const response = await addressApi.getUserAddress();
      return response;
    },
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressData) => addressApi.createUserAddress(addressData),
    onSuccess(data) {
      queryClient.invalidateQueries(["address"]);
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId) => addressApi.deleteUserAddress(addressId),
    onSuccess(data) {
      queryClient.invalidateQueries(["address"]);
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressData) => addressApi.updateUserAddress(addressData),
    onSuccess(data) {
      queryClient.getQueryData(["address"]);
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressData) => addressApi.setDefaultAddress(addressData),
    onSuccess(data) {
      queryClient.getQueryData(["address"]);
    },
  });
};

export const useLookupDigitalAddress = () => {
  return useMutation({
    mutationFn: (digitalAddress) => addressApi.lookupDigitalAddress(digitalAddress),
  });
};

export const useCreateAddressWithZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressData) => addressApi.createAddressWithZone(addressData),
    onSuccess() {
      queryClient.invalidateQueries(["address"]);
    },
  });
};

export const useLookupDigitalAddressFull = () => {
  return useMutation({
    mutationFn: async (digitalAddress) => {
      const response = await locationApi.lookupDigitalAddressFull(digitalAddress);
      return response.data;
    },
  });
};
