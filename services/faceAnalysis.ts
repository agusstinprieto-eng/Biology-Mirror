
import { FaceMesh } from '@mediapipe/face_mesh';
import { FACSVector } from '../types';

let faceMesh: FaceMesh | null = null;

// Initialize MediaPipe Face Mesh
export const initializeFaceMesh = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (faceMesh) {
            resolve();
            return;
        }

        faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults(() => {
            resolve();
        });

        faceMesh.initialize().then(resolve).catch(reject);
    });
};

// Calculate distance between two landmarks
const calculateDistance = (p1: [number, number, number], p2: [number, number, number]): number => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Calculate FACS (Facial Action Coding System) from landmarks
const calculateFACS = (landmarks: any[]): FACSVector => {
    // Key landmark indices based on MediaPipe Face Mesh
    const leftEyebrowInner = landmarks[66];
    const rightEyebrowInner = landmarks[296];
    const leftEyebrowOuter = landmarks[107];
    const rightEyebrowOuter = landmarks[336];
    const leftEyeTop = landmarks[159];
    const rightEyeTop = landmarks[386];
    const leftEyeBottom = landmarks[145];
    const rightEyeBottom = landmarks[374];
    const leftCheek = landmarks[205];
    const rightCheek = landmarks[425];
    const leftMouthCorner = landmarks[61];
    const rightMouthCorner = landmarks[291];
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const chin = landmarks[152];
    const noseTip = landmarks[1];

    // AU1: Inner Brow Raiser (distance between inner brows and eyes)
    const leftBrowEyeDist = calculateDistance(leftEyebrowInner, leftEyeTop);
    const rightBrowEyeDist = calculateDistance(rightEyebrowInner, rightEyeTop);
    const AU1 = ((leftBrowEyeDist + rightBrowEyeDist) / 2) * 100;

    // AU4: Brow Lowerer (inverse of brow height)
    const browHeight = ((leftEyebrowOuter[1] + rightEyebrowOuter[1]) / 2);
    const AU4 = Math.max(0, (1 - browHeight) * 10);

    // AU6: Cheek Raiser (eye squint)
    const leftEyeHeight = calculateDistance(leftEyeTop, leftEyeBottom);
    const rightEyeHeight = calculateDistance(rightEyeTop, rightEyeBottom);
    const eyeSquint = 1 - ((leftEyeHeight + rightEyeHeight) / 2);
    const AU6 = eyeSquint * 10;

    // AU12: Lip Corner Puller (smile)
    const mouthWidth = calculateDistance(leftMouthCorner, rightMouthCorner);
    const AU12 = mouthWidth * 50;

    // AU15: Lip Corner Depressor (frown)
    const leftCornerHeight = leftMouthCorner[1];
    const rightCornerHeight = rightMouthCorner[1];
    const cornerDrop = (leftCornerHeight + rightCornerHeight) / 2;
    const AU15 = Math.max(0, cornerDrop * 10);

    // AU17: Chin Raiser
    const chinHeight = chin[1];
    const AU17 = Math.max(0, (1 - chinHeight) * 10);

    // AU20: Lip Stretcher
    const lipStretch = mouthWidth / calculateDistance(upperLip, lowerLip);
    const AU20 = Math.min(5, lipStretch * 2);

    // AU24: Lip Pressor
    const lipDistance = calculateDistance(upperLip, lowerLip);
    const AU24 = Math.max(0, (0.1 - lipDistance) * 50);

    return {
        AU1: Math.min(5, AU1),
        AU4: Math.min(5, AU4),
        AU6: Math.min(5, AU6),
        AU12: Math.min(5, AU12),
        AU15: Math.min(5, AU15),
        AU17: Math.min(5, AU17),
        AU20: Math.min(5, AU20),
        AU24: Math.min(5, AU24)
    };
};

// Analyze face from video element
export const analyzeFace = async (videoElement: HTMLVideoElement): Promise<FACSVector> => {
    if (!faceMesh) {
        await initializeFaceMesh();
    }

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'));
            return;
        }

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        faceMesh!.onResults((results) => {
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                const facs = calculateFACS(landmarks);
                resolve(facs);
            } else {
                // Return neutral FACS if no face detected
                resolve({
                    AU1: 0, AU4: 0, AU6: 0, AU12: 0,
                    AU15: 0, AU17: 0, AU20: 0, AU24: 0
                });
            }
        });

        faceMesh!.send({ image: videoElement });
    });
};

// Analyze multiple frames and average
export const analyzeFaceMultiFrame = async (
    videoElement: HTMLVideoElement,
    numFrames: number = 10
): Promise<FACSVector> => {
    const results: FACSVector[] = [];

    for (let i = 0; i < numFrames; i++) {
        try {
            const facs = await analyzeFace(videoElement);
            results.push(facs);
            // Wait a bit between frames
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('Error analyzing frame:', error);
        }
    }

    if (results.length === 0) {
        return {
            AU1: 0, AU4: 0, AU6: 0, AU12: 0,
            AU15: 0, AU17: 0, AU20: 0, AU24: 0
        };
    }

    // Average all FACS values
    const averaged: FACSVector = {
        AU1: results.reduce((sum, r) => sum + r.AU1, 0) / results.length,
        AU4: results.reduce((sum, r) => sum + r.AU4, 0) / results.length,
        AU6: results.reduce((sum, r) => sum + r.AU6, 0) / results.length,
        AU12: results.reduce((sum, r) => sum + r.AU12, 0) / results.length,
        AU15: results.reduce((sum, r) => sum + r.AU15, 0) / results.length,
        AU17: results.reduce((sum, r) => sum + r.AU17, 0) / results.length,
        AU20: results.reduce((sum, r) => sum + r.AU20, 0) / results.length,
        AU24: results.reduce((sum, r) => sum + r.AU24, 0) / results.length
    };

    return averaged;
};
