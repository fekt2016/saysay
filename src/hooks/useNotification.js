export function useNotifications(options = {}) {
  const { isAuthenticated, user } = useAuth();

  const queryOptions = {
    limit: 10,
    sort: '-createdAt',
    ...options,
  };

  return useQuery({
    queryKey: ['notifications', queryOptions],
    queryFn: async () => {
      const response = await notificationApi.getNotifications(queryOptions);
      return response;
    },
    enabled: !!isAuthenticated && !!user, 
    staleTime: 1000 * 60 * 2, 
    retry: (failureCount, error) => {

      if (error?.response?.status === 401) {
        return false;
      }

      return failureCount < 2;
    },

    throwOnError: false,
  });
}export function useUnreadCount() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      return response?.data?.unreadCount || 0;
    },
    enabled: !!isAuthenticated && !!user,
    staleTime: 1000 * 30, 
  });
}export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      return await notificationApi.markAsRead(notificationId);
    },
    onMutate: async (notificationId) => {

      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueriesData({ 
        queryKey: ['notifications'] 
      });

      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old) => {
        if (!old?.data?.notifications) return old;

        const updatedNotifications = old.data.notifications.map((notification) => {
          if (notification._id === notificationId || notification.id === notificationId) {
            return {
              ...notification,
              read: true,
              isRead: true, 
              readAt: new Date().toISOString(),
            };
          }
          return notification;
        });

        return {
          ...old,
          data: {
            ...old.data,
            notifications: updatedNotifications,
          },
        };
      });

      queryClient.setQueryData(['notifications', 'unread-count'], (oldCount) => {
        return Math.max(0, (oldCount || 0) - 1);
      });

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {

      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {},
  });
}

export function useNotificationSettings() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const response = await notificationApi.getUserSettings();
      return response;
    },
    enabled: !!isAuthenticated && !!user, 
    initialData: {
      email: {
        orderUpdates: true,
        promotions: true,
        priceDrops: false,
        restockAlerts: true,
        accountSecurity: true,
        newsletters: false,
      },
      push: {
        orderUpdates: true,
        promotions: false,
        priceDrops: true,
        restockAlerts: true,
        accountActivity: true,
      },
      sms: {
        orderUpdates: true,
        promotions: false,
        securityAlerts: true,
      },
      app: {
        messages: true,
        friendActivity: false,
        recommendations: true,
      },
      frequency: {
        promotions: "weekly",
        newsletters: "monthly",
      },
      quietHours: {
        enabled: false,
        startTime: "22:00",
        endTime: "08:00",
      },
    },
  });
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path, value }) => {
      const currentSettings = queryClient.getQueryData([
        "notification-settings",
      ]);
      const newSettings = JSON.parse(JSON.stringify(currentSettings));

      const keys = path.split(".");
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      return await notificationApi.updateSettings(newSettings);
    },
    onMutate: async ({ path, value }) => {
      await queryClient.cancelQueries({ queryKey: ["notification-settings"] });

      const previousSettings = queryClient.getQueryData([
        "notification-settings",
      ]);

      queryClient.setQueryData(["notification-settings"], (old) => {
        const newData = JSON.parse(JSON.stringify(old));
        const keys = path.split(".");
        let current = newData;

        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        return newData;
      });

      return { previousSettings };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["notification-settings"],
        context.previousSettings
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}

export function useResetNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await notificationApi.resetSettings();
      return response;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notification-settings"] });
      const previousSettings = queryClient.getQueryData([
        "notification-settings",
      ]);

      queryClient.setQueryData(["notification-settings"], {
        email: {
          orderUpdates: true,
          promotions: true,
          priceDrops: false,
          restockAlerts: true,
          accountSecurity: true,
          newsletters: false,
        },
        push: {
          orderUpdates: true,
          promotions: false,
          priceDrops: true,
          restockAlerts: true,
          accountActivity: true,
        },
        sms: {
          orderUpdates: true,
          promotions: false,
          securityAlerts: true,
        },
        app: {
          messages: true,
          friendActivity: false,
          recommendations: true,
        },
        frequency: {
          promotions: "weekly",
          newsletters: "monthly",
        },
        quietHours: {
          enabled: false,
          startTime: "22:00",
          endTime: "08:00",
        },
      });

      return { previousSettings };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["notification-settings"],
        context.previousSettings
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}


