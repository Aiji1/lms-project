# RFID/QR Code Scanner Implementation for Student Attendance

## Overview

This document describes the implementation of RFID/QR code scanning functionality for student attendance in the LMS system. The implementation includes both camera-based QR code scanning and NFC/RFID card reading capabilities.

## Features Implemented

### 1. Camera QR Code Scanner
- **Library Used**: `react-qr-barcode-scanner` <mcreference link="https://www.npmjs.com/package/react-qr-barcode-scanner" index="1">1</mcreference>
- **Supported Formats**: QR codes, Code128, EAN, UPC, and other standard barcode formats
- **Camera Access**: Uses device's rear camera (environment facing mode)
- **Real-time Scanning**: Continuous scanning with 300ms intervals

### 2. NFC/RFID Reader
- **Technology**: Web NFC API <mcreference link="https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API" index="2">2</mcreference>
- **Supported Formats**: NDEF (NFC Data Exchange Format) - Text and URL records
- **Browser Support**: Chrome on Android with NFC enabled
- **Card Types**: NFC tags, RFID cards with NDEF formatting

### 3. Integrated Scanning Interface
- **Dual Mode**: Switch between QR code and NFC scanning
- **Student Lookup**: Automatic student data retrieval using NIS
- **Attendance Recording**: Direct attendance marking with configurable status
- **Real-time Feedback**: Success/error notifications and visual indicators

## File Structure

```
frontend/src/
├── components/
│   ├── QRCodeScanner.tsx          # Camera QR code scanning component
│   └── NFCReader.tsx               # NFC/RFID reading component
└── app/(dashboard)/presensi/harian/
    ├── page.tsx                    # Main attendance page (updated with scan button)
    ├── tambah/page.tsx            # Manual add attendance page
    ├── [id]/edit/page.tsx         # Edit attendance page
    └── scan/page.tsx              # Integrated scanning interface
```

## Component Details

### QRCodeScanner Component

**Location**: `/src/components/QRCodeScanner.tsx`

**Props**:
- `onScan: (result: string) => void` - Callback when QR code is successfully scanned
- `onError?: (error: string) => void` - Error handling callback
- `isActive?: boolean` - Scanner active state
- `onToggle?: () => void` - Toggle scanner callback

**Features**:
- Dynamic import to avoid SSR issues
- Duplicate scan prevention
- Auto-stop after successful scan
- Visual scanning frame overlay
- Camera permission handling

**Usage Example**:
```tsx
<StudentQRCodeScanner
  onScan={handleScan}
  onError={handleScanError}
  isActive={isScanning}
  onToggle={() => setIsScanning(!isScanning)}
/>
```

### NFCReader Component

**Location**: `/src/components/NFCReader.tsx`

**Props**:
- `onScan: (result: string) => void` - Callback when NFC tag is read
- `onError?: (error: string) => void` - Error handling callback
- `isActive?: boolean` - Reader active state
- `onToggle?: () => void` - Toggle reader callback

**Features**:
- Browser compatibility detection
- NDEF record parsing (Text and URL)
- Permission and error handling
- Visual feedback for scanning status
- Auto-cleanup on component unmount

**Usage Example**:
```tsx
<StudentNFCReader
  onScan={handleScan}
  onError={handleScanError}
  isActive={isScanning}
  onToggle={() => setIsScanning(!isScanning)}
/>
```

### Scanning Interface Page

**Location**: `/src/app/(dashboard)/presensi/harian/scan/page.tsx`

**Features**:
- Method selection (Barcode vs NFC)
- Student data display after successful scan
- Attendance status configuration
- Real-time attendance recording
- Error handling and success feedback

## Browser Compatibility

### QR Code Scanner
- **Supported**: All modern browsers with camera access
- **Requirements**: HTTPS (for camera permissions)
- **Mobile**: iOS Safari, Android Chrome, Firefox

### NFC Reader
- **Supported**: Chrome on Android (version 89+) <mcreference link="https://googlechrome.github.io/samples/web-nfc/" index="3">3</mcreference>
- **Requirements**: 
  - Android device with NFC hardware
  - NFC enabled in device settings
  - HTTPS connection
  - User permission granted

**Browser Support Matrix**:
| Feature | Chrome Desktop | Chrome Android | Safari iOS | Firefox |
|---------|---------------|----------------|------------|---------|
| QR Code Scanner | ✅ | ✅ | ✅ | ✅ |
| NFC Reader | ❌ | ✅ | ❌ | ❌ |

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install react-qr-barcode-scanner
```

### 2. Configure HTTPS (Required for Camera/NFC)

For development:
```bash
# Update next.config.ts for HTTPS if needed
# Or use ngrok for HTTPS tunneling
npx ngrok http 3000
```

For production:
```bash
# Ensure SSL certificate is properly configured
# Both camera and NFC require secure context (HTTPS)
```

### 3. NFC Setup (Android Only)

**Device Requirements**:
- Android device with NFC chip
- Chrome browser (version 89 or later)
- NFC enabled in Settings > Connected devices > NFC

**Card/Tag Requirements**:
- NFC tags formatted with NDEF records
- RFID cards with NFC capability and NDEF formatting
- Student ID cards should contain NIS in text format

## Data Flow

### Barcode Scanning Flow
1. User selects "Barcode Scanner" mode
2. Camera permission requested
3. Camera stream displays with scanning overlay
4. Barcode detected and decoded
5. NIS extracted from barcode data
6. Student lookup via API call
7. Attendance form populated
8. User confirms and submits attendance

### NFC Scanning Flow
1. User selects "NFC/RFID" mode
2. NFC permission requested (Android Chrome only)
3. User brings NFC card/tag near device
4. NDEF records read and parsed
5. NIS extracted from text/URL record
6. Student lookup via API call
7. Attendance form populated
8. User confirms and submits attendance

## API Integration

### Student Lookup
```typescript
// GET /api/siswa/{nis}
const response = await api.get(`/siswa/${nis}`);
```

### Attendance Recording
```typescript
// POST /api/presensi-harian
const attendanceData = {
  nis: student.nis,
  tanggal: getCurrentDate(),
  status_kehadiran: attendanceStatus,
  metode_presensi: scanMethod === 'barcode' ? 'Barcode Scanner' : 'NFC/RFID',
  waktu_presensi: getCurrentTime(),
  keterangan: `Presensi otomatis via ${scanMethod.toUpperCase()}`
};
```

## Error Handling

### Common Errors and Solutions

**Barcode Scanner**:
- `Camera access denied`: User needs to grant camera permissions
- `No camera found`: Device doesn't have camera or camera is in use
- `Barcode not readable`: Poor lighting or damaged barcode

**NFC Reader**:
- `NFC not supported`: Browser/device doesn't support Web NFC API
- `NFC access denied`: User needs to grant NFC permissions
- `NFC disabled`: User needs to enable NFC in device settings
- `Tag not readable`: Card/tag is not NDEF formatted or corrupted

**Student Lookup**:
- `Student not found`: NIS doesn't exist in database
- `API error`: Backend service unavailable or network issues

## Security Considerations

### Data Privacy
- Scanned data is processed locally before API calls
- No barcode/NFC data is stored permanently
- Student data is fetched securely via authenticated API

### Access Control
- Scanning functionality requires user authentication
- Role-based access control for attendance management
- Audit trail for all attendance records

### HTTPS Requirement
- Camera and NFC APIs require secure context (HTTPS)
- Ensures encrypted data transmission
- Prevents man-in-the-middle attacks

## Performance Optimization

### QR Code Scanner
- Dynamic import prevents SSR issues
- Configurable scan intervals (300ms default)
- Auto-stop after successful scan to save battery
- Duplicate scan prevention

### NFC Reader
- Event listener cleanup on component unmount
- Efficient NDEF record parsing
- Minimal DOM updates during scanning

## Future Enhancements

### Planned Features
1. **Bulk Scanning**: Scan multiple students in sequence
2. **Offline Support**: Cache scanned data when network is unavailable
3. **Advanced Filters**: Filter by class, time range, etc.
4. **Export Options**: Export attendance data in various formats
5. **Analytics**: Scanning success rates and performance metrics

### Technical Improvements
1. **WebAssembly**: Faster QR code processing with WASM
2. **Service Worker**: Background scanning capabilities
3. **Push Notifications**: Real-time attendance alerts
4. **Biometric Integration**: Fingerprint scanning support

## Troubleshooting

### Development Issues

**Build Errors**:
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**TypeScript Errors**:
```bash
# Update type definitions
npm install --save-dev @types/react
```

### Runtime Issues

**Camera Not Working**:
1. Check HTTPS connection
2. Verify camera permissions in browser
3. Ensure camera is not in use by other applications
4. Try different browsers

**NFC Not Working**:
1. Verify Android Chrome browser
2. Check NFC is enabled in device settings
3. Ensure HTTPS connection
4. Test with known working NFC tags
5. Check browser console for detailed errors

## Testing

### Manual Testing Checklist

**QR Code Scanner**:
- [ ] Camera permission prompt appears
- [ ] Camera stream displays correctly
- [ ] QR code detection works with various formats
- [ ] Student lookup successful with valid NIS
- [ ] Error handling for invalid QR codes
- [ ] Auto-stop after successful scan

**NFC Reader**:
- [ ] Browser compatibility detection
- [ ] NFC permission prompt (Android Chrome)
- [ ] Tag reading with NDEF text records
- [ ] Tag reading with NDEF URL records
- [ ] Student lookup successful
- [ ] Error handling for unsupported browsers

**Integration**:
- [ ] Method switching works correctly
- [ ] Attendance form populates after scan
- [ ] Attendance submission successful
- [ ] Navigation and UI responsiveness
- [ ] Error messages display correctly

### Automated Testing

```bash
# Run component tests
npm run test

# Run E2E tests (if configured)
npm run test:e2e
```

## Support and Maintenance

### Browser Updates
- Monitor Web NFC API changes and browser support
- Update QR code scanner library regularly
- Test with new browser versions

### Device Compatibility
- Test with various Android devices for NFC
- Verify camera functionality across different devices
- Update compatibility documentation

### Performance Monitoring
- Monitor scanning success rates
- Track API response times
- Analyze user feedback and error reports

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team