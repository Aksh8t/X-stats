let startTime = Date.now();
let messageCount = 0;
let currentTopics = new Set();

// Topic detection keywords
const topicKeywords = {
    'Programming': ['code', 'function', 'programming', 'developer', 'bug', 'api', 'database'],
    'Writing': ['essay', 'article', 'write', 'content', 'blog', 'story'],
    'Math': ['calculate', 'equation', 'math', 'formula', 'number'],
    'Business': ['market', 'strategy', 'business', 'company', 'profit'],
    'Science': ['experiment', 'research', 'theory', 'scientific', 'study'],
    'AI': ['machine learning', 'artificial intelligence', 'neural', 'model', 'train'],
    'General': ['help', 'explain', 'what is', 'how to', 'define']
};

function detectTopics(text) {
    const detectedTopics = new Set();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
            detectedTopics.add(topic);
        }
    }
    return Array.from(detectedTopics);
}

function initializeMessageTracking() {
    const targetNode = document.querySelector('form');
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const textarea = targetNode.querySelector('textarea');
                if (textarea) {
                    setupTextareaListener(textarea);
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true, subtree: true });
}

function setupTextareaListener(textarea) {
    textarea.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            messageCount++;
            const content = textarea.value;
            const topics = detectTopics(content);
            topics.forEach(topic => currentTopics.add(topic));

            const messageData = {
                timestamp: Date.now(),
                content: content,
                topics: Array.from(currentTopics),
                messageNumber: messageCount
            };

            await updateStorage(messageData);
        }
    });
}

async function updateStorage(messageData) {
    try {
        const { usageData = [] } = await chrome.storage.local.get('usageData');
        usageData.push(messageData);
        await chrome.storage.local.set({ usageData });
    } catch (error) {
        console.error('Error updating storage:', error);
    }
}

window.addEventListener('load', initializeMessageTracking);

window.addEventListener('beforeunload', async () => {
    const endTime = Date.now();
    const sessionDuration = (endTime - startTime) / 1000;

    const sessionData = {
        start: startTime,
        end: endTime,
        duration: sessionDuration,
        messageCount: messageCount,
        topics: Array.from(currentTopics),
        productivity: messageCount / (sessionDuration / 60)
    };

    try {
        const { sessionData: existingData = [] } = await chrome.storage.local.get('sessionData');
        existingData.push(sessionData);
        await chrome.storage.local.set({ sessionData: existingData });
    } catch (error) {
        console.error('Error saving session data:', error);
    }
});