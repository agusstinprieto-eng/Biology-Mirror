
import { FaceMesh } from '@mediapipe/face_mesh';
import { FACSVector } from '../types';

let faceMesh: FaceMesh | null = null;
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;
let activeResolve: ((results: any) => void) | null = null;

export interface FaceAnalysisResult {
    facs: FACSVector;
    landmarks: any[];
}

export const initializeFaceMesh = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (faceMesh) {
            resolve();
            return;
        }

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
            // Priority 1: Single frame analysis promise
            if (activeResolve) {
                activeResolve(results);
                activeResolve = null;
            }
            // Priority 2: Real-time listeners
            if (onResultsCallback) {
                onResultsCallback(results);
            }
        });

        faceMesh.initialize().then(() => resolve()).catch(reject);
    });
};

let onResultsCallback: ((results: any) => void) | null = null;

export const setRealtimeCallback = (cb: (results: any) => void) => {
    onResultsCallback = cb;
};

export const getFaceMeshInstance = () => faceMesh;

const calculateDistance = (p1: any, p2: any): number => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
};

const calculateFACS = (landmarks: any[]): FACSVector => {
    const p = (i: number) => landmarks[i];

    const leftBrowEyeDist = calculateDistance(p(66), p(159));
    const rightBrowEyeDist = calculateDistance(p(296), p(386));
    const AU1 = ((leftBrowEyeDist + rightBrowEyeDist) / 2) * 100;

    const browHeight = ((p(107).y + p(336).y) / 2);
    const AU4 = Math.max(0, (1 - browHeight) * 10);

    const eyeSquint = 1 - ((calculateDistance(p(159), p(145)) + calculateDistance(p(386), p(374))) / 2);
    const AU6 = eyeSquint * 10;

    const mouthWidth = calculateDistance(p(61), p(291));
    const AU12 = mouthWidth * 50;

    const cornerDrop = (p(61).y + p(291).y) / 2;
    const AU15 = Math.max(0, cornerDrop * 10);

    const AU17 = Math.max(0, (1 - p(152).y) * 10);

    const lipStretch = mouthWidth / calculateDistance(p(13), p(14));
    const AU20 = Math.min(5, lipStretch * 2);

    const lipDistance = calculateDistance(p(13), p(14));
    const AU24 = Math.max(0, (0.1 - lipDistance) * 50);

    return {
        AU1: Math.min(5, AU1), AU4: Math.min(5, AU4), AU6: Math.min(5, AU6), AU12: Math.min(5, AU12),
        AU15: Math.min(5, AU15), AU17: Math.min(5, AU17), AU20: Math.min(5, AU20), AU24: Math.min(5, AU24)
    };
};

export const analyzeFace = async (videoElement: HTMLVideoElement): Promise<FaceAnalysisResult> => {
    if (!faceMesh) await initializeFaceMesh();

    if (!sharedCanvas) {
        sharedCanvas = document.createElement('canvas');
        sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
    }

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve({
                facs: { AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 },
                landmarks: []
            });
        }, 1500);

        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            clearTimeout(timeout);
            resolve({
                facs: { AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 },
                landmarks: []
            });
            return;
        }

        sharedCanvas!.width = videoElement.videoWidth;
        sharedCanvas!.height = videoElement.videoHeight;
        sharedCtx!.drawImage(videoElement, 0, 0);

        activeResolve = (results) => {
            clearTimeout(timeout);
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                resolve({
                    facs: calculateFACS(landmarks),
                    landmarks
                });
            } else {
                resolve({
                    facs: { AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 },
                    landmarks: []
                });
            }
        };

        faceMesh!.send({ image: sharedCanvas! }); // Use canvas, not video, for stability
    });
};

export const analyzeFaceMultiFrame = async (
    videoElement: HTMLVideoElement,
    numFrames: number = 10,
    onProgress?: (progress: number) => void
): Promise<FaceAnalysisResult> => {
    const results: FACSVector[] = [];
    let lastLandmarks: any[] = [];

    for (let i = 0; i < numFrames; i++) {
        try {
            const { facs, landmarks } = await analyzeFace(videoElement);
            results.push(facs);
            if (landmarks.length > 0) lastLandmarks = landmarks;

            if (onProgress) onProgress(Math.round(((i + 1) / numFrames) * 100));
            if (i % 3 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
        } catch (error) {
            console.error('Error analyzing frame:', error);
        }
    }

    const defaultFacs = { AU1: 0, AU4: 0, AU6: 0, AU12: 0, AU15: 0, AU17: 0, AU20: 0, AU24: 0 };
    if (results.length === 0) return { facs: defaultFacs, landmarks: [] };

    const averagedFacs = {
        AU1: results.reduce((sum, r) => sum + r.AU1, 0) / results.length,
        AU4: results.reduce((sum, r) => sum + r.AU4, 0) / results.length,
        AU6: results.reduce((sum, r) => sum + r.AU6, 0) / results.length,
        AU12: results.reduce((sum, r) => sum + r.AU12, 0) / results.length,
        AU15: results.reduce((sum, r) => sum + r.AU15, 0) / results.length,
        AU17: results.reduce((sum, r) => sum + r.AU17, 0) / results.length,
        AU20: results.reduce((sum, r) => sum + r.AU20, 0) / results.length,
        AU24: results.reduce((sum, r) => sum + r.AU24, 0) / results.length
    };

    return { facs: averagedFacs, landmarks: lastLandmarks };
};
