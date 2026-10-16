// Define a shared data structure to ensure media links are always synced
import { MOTION_DATA } from './motion';
import { DEV_DATA } from './dev';

export const PROJECT_DATA = [
  ...MOTION_DATA,
  ...DEV_DATA
];
