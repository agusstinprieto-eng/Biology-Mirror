
import { supabase } from './supabaseClient';
import { SessionData, AssessmentResult } from '../types';

export const saveSession = async (data: SessionData) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: session, error } = await supabase
        .from('sessions')
        .insert({
            user_id: user?.id,
            stage: data.stage,
            facs: data.facs,
            bio: data.bio,
            gaze: data.gaze,
            skin: data.skin,
            transcript: data.transcript,
            user_name: data.userName,
            timestamp: data.timestamp
        })
        .select()
        .single();

    if (error) throw error;
    return session;
};

export const saveAnalysis = async (
    preId: string,
    postId: string,
    result: AssessmentResult
) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: analysis, error } = await supabase
        .from('analyses')
        .insert({
            user_id: user?.id,
            pre_session_id: preId,
            post_session_id: postId,
            neuro_score: result.neuroScore,
            key_shift: result.keyShift,
            detailed_analysis: result.detailedAnalysis,
            visual_cues: result.visualCues,
            recommendations: result.recommendations
        })
        .select()
        .single();

    if (error) throw error;
    return analysis;
};

export const getSessionHistory = async (): Promise<SessionData[]> => {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
};
