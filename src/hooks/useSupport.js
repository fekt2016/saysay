import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supportApi from '../services/supportApi';

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketData) => supportApi.createTicket(ticketData),
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-list'] });
    },
    onError: (error) => {
      console.error('Failed to create ticket:', error);
    },
  });
};

export const useMyTickets = (params = {}) => {
  return useQuery({
    queryKey: ['support-tickets', 'my', params],
    queryFn: () => supportApi.listTickets(params),
    staleTime: 30000, 
  });
};

export const useTicketDetail = (ticketId) => {
  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => supportApi.getTicketById(ticketId),
    enabled: !!ticketId,
    staleTime: 10000, 
  });
};

export const useReplyToTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, replyData }) => {
      return supportApi.replyToTicket(ticketId, replyData);
    },
    onSuccess: (data, variables) => {

      queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-list'] });
    },
    onError: (error) => {
      console.error('Failed to send reply:', error);
    },
  });
};

export default {
  useCreateTicket,
  useMyTickets,
  useTicketDetail,
  useReplyToTicket,
};


