import { Report, User } from '../types';

const API_BASE_URL = 'https://piuss-biosenetinel-server.hf.space';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RegistrationData {
  name: string;
  email: string;
  age: number;
  gender: string;
  medicalHistory?: string;
}

export interface RequestData {
  id: string;
  patientName: string;
  patientEmail: string;
  patientAge: number;
  patientGender: string;
  medicalHistory?: string;
  status: string;
  timestamp: string;
  fileName?: string;
  analysisData?: any;
}

/**
 * POST - Register new patient request
 */
export const registerPatient = async (data: RegistrationData): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_name: data.name,
        patient_email: data.email,
        patient_age: data.age,
        patient_gender: data.gender,
        medical_history: data.medicalHistory || '',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
      message: 'Registration submitted successfully'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
};

/**
 * GET - Fetch all requests (for Lab and Doctor)
 */
export const getRequests = async (): Promise<ApiResponse<RequestData[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-request`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Fetch requests error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch requests'
    };
  }
};

/**
 * PUT - Modify request (approve/decline registration, update status)
 */
export const modifyRequest = async (requestId: string, updates: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/modify-request/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
      message: 'Request updated successfully'
    };
  } catch (error) {
    console.error('Modify request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update request'
    };
  }
};

/**
 * POST - Upload FASTQ file for analysis
 */
export const uploadFastqFile = async (
  file: File,
  requestId: string,
  patientId: string,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<any>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('request_id', requestId);
    formData.append('patient_id', patientId);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              data: result,
              message: 'File uploaded successfully'
            });
          } catch (e) {
            resolve({
              success: true,
              data: { response: xhr.responseText },
              message: 'File uploaded successfully'
            });
          }
        } else {
          reject({
            success: false,
            error: `Upload failed with status: ${xhr.status}`
          });
        }
      });

      xhr.addEventListener('error', () => {
        reject({
          success: false,
          error: 'Network error during upload'
        });
      });

      xhr.open('POST', `${API_BASE_URL}/request`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * GET - Download file (PDF report or FASTQ file)
 */
export const downloadFile = async (filename: string): Promise<Blob | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/download/${filename}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
};

/**
 * Helper - Trigger file download in browser
 */
export const triggerFileDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Helper - Convert API response to Report format
 */
export const convertApiToReport = (apiData: RequestData): Partial<Report> => {
  return {
    id: apiData.id,
    patientName: apiData.patientName,
    patientEmail: apiData.patientEmail,
    patientAge: apiData.patientAge,
    patientGender: apiData.patientGender,
    medicalHistory: apiData.medicalHistory,
    timestamp: apiData.timestamp,
    fileName: apiData.fileName,
    analysisData: apiData.analysisData,
  };
};
