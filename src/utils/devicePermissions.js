import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import logger from './logger';export const PERMISSION_TYPES = {
  CAMERA: 'camera',
  PHOTO_LIBRARY: 'photoLibrary',
  LOCATION: 'location',
  NOTIFICATIONS: 'notifications',
};export const PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
  BLOCKED: 'blocked', 
};export const isPermissionGranted = (status) => {
  return status === PERMISSION_STATUS.GRANTED;
};export const canRequestPermission = (status) => {
  return status === PERMISSION_STATUS.UNDETERMINED 
         status === PERMISSION_STATUS.DENIED;
};export const getPermissionStatus = async (permissionType) => {
  try {
    switch (permissionType) {
      case PERMISSION_TYPES.CAMERA:
        const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
        return cameraStatus.status;

      case PERMISSION_TYPES.PHOTO_LIBRARY:
        const photoStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
        return photoStatus.status;

      case PERMISSION_TYPES.LOCATION:
        const locationStatus = await Location.getForegroundPermissionsAsync();
        return locationStatus.status;

      case PERMISSION_TYPES.NOTIFICATIONS:
        const notificationStatus = await Notifications.getPermissionsAsync();
        return notificationStatus.status;

      default:
        return PERMISSION_STATUS.UNDETERMINED;
    }
  } catch (error) {
    logger.error(`Error checking ${permissionType} permission:`, error);
    return PERMISSION_STATUS.UNDETERMINED;
  }
};


