
import { FaceMesh } from '@mediapipe/face_mesh';
import { FACSVector } from '../types';

let faceMesh: FaceMesh | null = null;
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

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

// Calculate FACS from landmarks
const calculateFACS = (landmarks: any[]): FACSVector => {
    const leftEyebrowInner = landmarks[66];
    const rightEyebrowInner = landmarks[296];
    const leftEyebrowOuter = landmarks[107];
    const rightEyebrowOuter = landmarks[336];
    const leftEyeTop = landmarks[159];
    const rightEyeTop = landmarks[386];
    const leftEyeBottom = landmarks[145];
    const rightEyeBottom = landmarks[374];
    const leftMouthCorner = landmarks[61];
    const rightMouthCorner = landmarks[291];
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const chin = landmarks[152];

    // AU1: Inner Brow Raiser
    const leftBrowEyeDist = calculateDistance(leftEyebrowInner, leftEyeTop);
    const rightBrowEyeDist = calculateDistance(rightEyebrowInner, rightEyeTop);
    const AU1 = ((leftBrowEyeDist + rightBrowEyeDist) / 2) * 100;

    // AU4: Brow Lowerer
    const browHeight = ((leftEyebrowOuter[1] + rightEyebrowOuter[1]) / 2);
    const AU4 = Math.max(0, (1 - browHeight) * 10);

    // AU6: Cheek Raiser
    const leftEyeHeight = calculateDistance(leftEyeTop, leftEyeBottom);
    const rightEyeHeight = calculateDistance(rightEyeTop, rightEyeBottom);
    const eyeSquint = 1 - ((leftEyeHeight + rightEyeHeight) / 2);
    const AU6 = eyeSquint * 10;

    // AU12: Lip Corner Puller
    const mouthWidth = calculateDistance(leftMouthCorner, rightMouthCorner);
    const AU12 = mouthWidth * 50;

    // AU15: Lip Corner Depressor
    const cornerDrop = (leftMouthCorner[1] + rightMouthCorner[1]) / 2;
    const AU15 = Math.max(0, cornerDrop * 10);

    // AU17: Chin Raiser
    const AU17 = Math.max(0, (1 - chin[1]) * 10);

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

// Analyze face from video element (optimized)
export const analyzeFace = async (videoElement: HTMLVideoElement): Promise<FACSVector> => {
    if (!faceMesh) await initializeFaceMesh();

    if (!sharedCanvas) {
        sharedCanvas = document.createElement('canvas');
        sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
    }

    return new Promise((resolve) => {
        sharedCanvas!.width = videoElement.videoWidth;
        sharedCanvas!.height = videoElement.videoHeight;
        sharedCtx!.drawImage(videoElement, 0, 0, sharedCanvas!.width, sharedCanvas!.height);

        faceMesh!.onResults((results) => {
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                resolve(calculateFACS(results.multiFaceLandmarks[0]));
            } else {
                resolve({ AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 });
            }
        });

        faceMesh!.send({ image: videoElement });
    });
};

// Analyze multiple frames (optimized: removed setTimeout)
export const analyzeFaceMultiFrame = async (
    videoElement: HTMLVideoElement,
    numFrames: number = 10
): Promise<FACSVector> => {
    const results: FACSVector[] = [];

    for (let i = 0; i < numFrames; i++) {
        try {
            const facs = await analyzeFace(videoElement);
            results.push(facs);
            // Non-blocking wait for next frame if needed, but here we want speed
            if (i % 5 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
        } catch (error) {
            console.error('Error analyzing frame:', error);
        }
    }

    if (results.length === 0) {
        return { AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 };
    }

    return {
        AU1: results.reduce((sum, r) => sum + r.AU1, 0) / results.length,
        AU4: results.reduce((sum, r) => sum + r.AU4, 0) / results.length,
        AU6: results.reduce((sum, r) => sum + r.AU6, 0) / results.length,
        AU12: results.reduce((sum, r) => sum + r.AU12, 0) / results.length,
        AU15: results.reduce((sum, r) => sum + r.AU15, 0) / results.length,
        AU17: results.reduce((sum, r) => sum + r.AU17, 0) / results.length,
        AU20: results.reduce((sum, r) => sum + r.AU20, 0) / results.length,
        AU24: results.reduce((sum, r) => sum + r.AU24, 0) / results.length
    };
};
