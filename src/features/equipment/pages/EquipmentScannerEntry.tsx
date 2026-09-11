import React from 'react';
import { Capacitor } from '@capacitor/core';
import EquipmentScanner from './EquipmentScanner';
import NativeEquipmentScanner from './NativeEquipmentScanner';

const USE_NATIVE_ANDROID_SCANNER =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

const EquipmentScannerEntry: React.FC = () => {
  return USE_NATIVE_ANDROID_SCANNER ? <NativeEquipmentScanner /> : <EquipmentScanner />;
};

export default EquipmentScannerEntry;
