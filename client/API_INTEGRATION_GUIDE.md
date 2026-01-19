# BioSentinel API Integration Guide

## Overview
This document describes the complete integration of the BioSentinel frontend with the API server at `https://piuss-biosenetinel-server.hf.space`.

## API Endpoints Integrated

### 1. Patient Registration
**Endpoint:** `POST /request`

**Request Body:**
```json
{
  "name": "Patient Name",
  "email": "patient@example.com",
  "age": 30,
  "gender": "Male",
  "medicalHistory": "Patient medical history"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "REQ-1234",
    "status": "pending"
  }
}
```

**Implementation:** `services/api.ts -> registerPatient()`

### 2. Get All Requests
**Endpoint:** `GET /get-request`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "REQ-1234",
      "name": "Patient Name",
      "email": "patient@example.com",
      "age": 30,
      "gender": "Male",
      "medicalHistory": "...",
      "status": "pending",
      "timestamp": "2024-01-15 10:30"
    }
  ]
}
```

**Implementation:** `services/api.ts -> getRequests()`

### 3. Modify Request Status
**Endpoint:** `PUT /modify-request/{request_id}`

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Registration approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request updated successfully"
}
```

**Implementation:** `services/api.ts -> modifyRequest()`

### 4. File Upload
**Endpoint:** `POST /upload-fastq` (implementation may vary)

**Request:** Multipart form data
- `file`: FASTQ/FASTA file
- `reportId`: Report identifier
- `patientId`: Patient identifier

**Implementation:** `services/api.ts -> uploadFastqFile()`
- Uses XMLHttpRequest for progress tracking
- Supports FASTQ, FASTA, and GZ compressed files
- Progress callback for UI updates

### 5. File Download
**Endpoint:** `GET /download/{filename}`

**Response:** PDF file blob

**Implementation:** `services/api.ts -> downloadFile()` and `triggerFileDownload()`

## WebSocket Integration

### Connection
**URL:** `wss://piuss-biosenetinel-server.hf.space/ws`

**Implementation:** `services/websocket.ts -> WebSocketService`

### Message Format (Expected)
```json
{
  "type": "analysis_progress",
  "reportId": "RS-1234",
  "stage": "embedding",
  "progress": 45,
  "message": "Generating AI Embeddings..."
}
```

### Features
- Auto-reconnection (max 5 attempts)
- Progress tracking for real-time analysis
- Fallback simulation if WebSocket unavailable
- Error handling and status callbacks

### Analysis Stages
1. **Preprocessing** (0-20%)
2. **Embedding** (20-50%)
3. **UMAP & HDBSCAN** (50-80%)
4. **Generating Report** (80-100%)

## File Structure

```
services/
├── api.ts              # REST API integration
├── websocket.ts        # WebSocket service
└── fileProcessor.ts    # FASTQ/FASTA parsing

components/
├── PatientPortal.tsx   # Patient registration & upload
└── LabPortal.tsx       # Lab approval & analysis
```

## Workflow

### Patient Registration Flow
1. **Patient fills registration form** → `PatientPortal.tsx`
2. **Submit registration** → `registerPatient()` → POST `/request`
3. **Create PENDING_REGISTRATION report** → Stored locally
4. **Wait for lab approval**

### Lab Approval Flow
1. **Lab fetches requests** → `getRequests()` → GET `/get-request`
2. **Review registration details** → Modal UI
3. **Approve/Decline** → `modifyRequest()` → PUT `/modify-request/{id}`
4. **Update local report status**

### File Upload & Analysis Flow
1. **Patient selects FASTQ file** → File validation
2. **Click Upload** → `uploadFastqFile()` → POST with progress
3. **Initialize WebSocket** → `wsService.connect()`
4. **Subscribe to analysis** → `wsService.subscribeToAnalysis(reportId)`
5. **Real-time updates** → Progress bar & stage display
6. **Analysis complete** → PDF available

### PDF Download Flow
1. **Click Download Report** → `downloadFile(filename)`
2. **Fetch PDF** → GET `/download/{filename}`
3. **Trigger browser download** → `triggerFileDownload()`

## Error Handling

### API Errors
- Network errors: Display alert with error message
- 404 Not Found: "Resource not found"
- 500 Server Error: "Server error occurred"
- Timeout: Configurable (default 30s for upload, 10s for others)

### WebSocket Errors
- Connection failed: Fallback to simulation
- Max reconnect attempts: 5
- Reconnect delay: 2 seconds

### File Upload Errors
- Invalid file type: Alert before upload
- Upload failed: Display error message
- Large files: Progress tracking prevents timeout perception

## Configuration

### Base URLs
```typescript
const API_BASE = 'https://piuss-biosenetinel-server.hf.space';
const WS_URL = 'wss://piuss-biosenetinel-server.hf.space/ws';
```

### Timeouts
```typescript
DEFAULT_TIMEOUT = 10000;  // 10 seconds
UPLOAD_TIMEOUT = 30000;   // 30 seconds
```

### WebSocket
```typescript
MAX_RECONNECT_ATTEMPTS = 5;
RECONNECT_DELAY = 2000;   // 2 seconds
```

## Testing Checklist

- [ ] Patient registration successful
- [ ] Lab receives registration requests
- [ ] Approve/decline updates status correctly
- [ ] File upload with progress tracking
- [ ] WebSocket connection established
- [ ] Real-time progress updates received
- [ ] PDF download functionality
- [ ] Error handling for network failures
- [ ] WebSocket reconnection on disconnect

## Development Notes

### Running the Application
```bash
cd client
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

### File Format Support
- FASTQ: `.fastq`, `.fq`
- FASTA: `.fasta`, `.fa`
- Compressed: `.fastq.gz`, `.fq.gz`, `.gz`

### Browser Compatibility
- Modern browsers with WebSocket support
- File API support required
- Blob download support required

## API Documentation
Full API documentation available at:
`https://piuss-biosenetinel-server.hf.space/docs`

## Support
For API issues, contact the backend team or check the Swagger documentation at the `/docs` endpoint.
