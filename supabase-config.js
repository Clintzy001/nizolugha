// supabase-config.js

// 1. Initialize the client (Replace with your actual URL and Key)
const _supabase = supabase.createClient('https://your-project-id.supabase.co', 'your-anon-key');

// 2. Export functions to the window object so other files can see them
window.getLessonContent = async function(langId, category, type) {
    const { data, error } = await _supabase
        .from('learning_content')
        .select('*')
        .eq('language_id', langId)
        .eq('category', category)
        .eq('type', type);

    if (error) {
        console.error(`Error fetching ${type}:`, error);
        return [];
    }
    return data;
};

window.completeSession = async function(contentId, wasCorrect, xpEarned) {
    const user = JSON.parse(localStorage.getItem('nizo_user'));
    if (!user) return;

    // Log progress
    await _supabase.from('user_progress').upsert({ 
        user_id: user.id, 
        content_id: contentId,
        status: wasCorrect ? 'mastered' : 'learning',
        last_score: wasCorrect ? 100 : 0
    }, { onConflict: 'user_id,content_id' });

    // Update XP via the SQL function we created earlier
    if (wasCorrect) {
        await _supabase.rpc('increment_xp', { 
            user_id: user.id, 
            xp_to_add: xpEarned 
        });

        // Local storage sync
        let stats = JSON.parse(localStorage.getItem('nizo_stats')) || { xp: 0 };
        stats.xp += xpEarned;
        localStorage.setItem('nizo_stats', JSON.stringify(stats));
    }
};
