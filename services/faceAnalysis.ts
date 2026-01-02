
import { FaceMesh } from '@mediapipe/face_mesh';
import { FACSVector } from '../types';

let faceMesh: FaceMesh | null = null;
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;
let activeResolve: ((results: any) => void) | null = null;

// Initialize MediaPipe Face Mesh
export const initializeFaceMesh = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (faceMesh) {
            resolve();
            return;
        }

        console.log("Initializing MediaPipe FaceMesh...");
        faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
            if (activeResolve) {
                activeResolve(results);
                activeResolve = null;
            }
        });

        faceMesh.initialize().then(() => {
            console.log("FaceMesh initialized.");
            resolve();
        }).catch(reject);
    });
};

const calculateDistance = (p1: [number, number, number], p2: [number, number, number]): number => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const calculateFACS = (landmarks: any[]): FACSVector => {
    const p = (i: number): [number, number, number] => [landmarks[i].x, landmarks[i].y, landmarks[i].z];

    // AU1: Inner Brow Raiser
    const leftBrowEyeDist = calculateDistance(p(66), p(159));
    const rightBrowEyeDist = calculateDistance(p(296), p(386));
    const AU1 = ((leftBrowEyeDist + rightBrowEyeDist) / 2) * 100;

    // AU4: Brow Lowerer
    const browHeight = ((landmarks[107].y + landmarks[336].y) / 2);
    const AU4 = Math.max(0, (1 - browHeight) * 10);

    // AU6: Cheek Raiser
    const eyeSquint = 1 - ((calculateDistance(p(159), p(145)) + calculateDistance(p(386), p(374))) / 2);
    const AU6 = eyeSquint * 10;

    // AU12: Lip Corner Puller
    const mouthWidth = calculateDistance(p(61), p(291));
    const AU12 = mouthWidth * 50;

    // AU15: Lip Corner Depressor
    const cornerDrop = (landmarks[61].y + landmarks[291].y) / 2;
    const AU15 = Math.max(0, cornerDrop * 10);

    // AU17: Chin Raiser
    const AU17 = Math.max(0, (1 - landmarks[152].y) * 10);

    // AU20: Lip Stretcher
    const lipStretch = mouthWidth / calculateDistance(p(13), p(14));
    const AU20 = Math.min(5, lipStretch * 2);

    // AU24: Lip Pressor
    const lipDistance = calculateDistance(p(13), p(14));
    const AU24 = Math.max(0, (0.1 - lipDistance) * 50);

    return {
        AU1: Math.min(5, AU1), AU4: Math.min(5, AU4), AU6: Math.min(5, AU6), AU12: Math.min(5, AU12),
        AU15: Math.min(5, AU15), AU17: Math.min(5, AU17), AU20: Math.min(5, AU20), AU24: Math.min(5, AU24)
    };
};

export const analyzeFace = async (videoElement: HTMLVideoElement): Promise<FACSVector> => {
    if (!faceMesh) await initializeFaceMesh();

    if (!sharedCanvas) {
        sharedCanvas = document.createElement('canvas');
        sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
    }

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve({ AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 });
        }, 1000);

        sharedCanvas!.width = videoElement.videoWidth;
        sharedCanvas!.height = videoElement.videoHeight;
        sharedCtx!.drawImage(videoElement, 0, 0);

        activeResolve = (results) => {
            clearTimeout(timeout);
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                resolve(calculateFACS(results.multiFaceLandmarks[0]));
            } else {
                resolve({ AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 });
            }
        };

        faceMesh!.send({ image: videoElement });
    });
};

export const analyzeFaceMultiFrame = async (
    videoElement: HTMLVideoElement,
    numFrames: number = 10,
    onProgress?: (progress: number) => void
): Promise<FACSVector> => {
    const results: FACSVector[] = [];
    for (let i = 0; i < numFrames; i++) {
        try {
            const facs = await analyzeFace(videoElement);
            results.push(facs);
            if (onProgress) onProgress(Math.round(((i + 1) / numFrames) * 100));
            // Don't wait too long
            if (i % 3 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
        } catch (error) {
            console.error('Error analyzing frame:', error);
        }
    }
    if (results.length === 0) return { AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 };
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
