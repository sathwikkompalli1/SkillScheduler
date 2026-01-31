const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate daily topics breakdown for a skill
 * @param {Object} params - Parameters for topic generation
 * @param {string} params.skillName - Name of the skill to learn
 * @param {number} params.targetDays - Number of days to learn the skill
 * @param {number} params.dailyHours - Total hours available per day
 * @param {number} params.availableHoursPerSkill - Hours available for THIS skill (after accounting for other skills)
 * @param {Array} params.existingSkills - User's existing skills
 * @returns {Promise<Array>} Array of daily topics with importance scores
 */
const generateDailyTopics = async ({ skillName, targetDays, dailyHours, availableHoursPerSkill, existingSkills = [] }) => {
    // Use the available hours per skill if provided, otherwise use full daily hours
    const hoursForThisSkill = availableHoursPerSkill || dailyHours;

    const prompt = `You are an expert curriculum designer. Create a structured learning plan for the skill: "${skillName}".

User Context:
- Available days: ${targetDays}
- Daily learning hours for THIS SKILL: ${hoursForThisSkill} hours (STRICT LIMIT - DO NOT EXCEED)
- User's total daily free time: ${dailyHours} hours
- Existing skills: ${existingSkills.length > 0 ? existingSkills.join(', ') : 'None specified'}

CRITICAL TIME CONSTRAINT: Each day's task MUST fit within ${hoursForThisSkill} hours maximum. This is a hard limit.

Generate a day-by-day learning plan with specific topics. For each day, provide:
1. Topic name (concise)
2. Brief description
3. Estimated hours needed (MUST be <= ${hoursForThisSkill} hours)
4. Importance score (1-5): How critical is this topic for mastery? 5=foundational/critical, 1=nice-to-have
5. isSplittable (true/false): Can this topic be split across multiple days if needed?

Consider:
- Start with fundamentals and progress to advanced topics
- Include practical exercises and projects
- Build on existing skills where applicable
- Each day MUST be achievable within ${hoursForThisSkill} hours - plan smaller, focused topics
- Foundational topics should have higher importance (4-5)
- Review/practice sessions can have lower importance (1-2)
- Complex topics that build on each other should be splittable

Respond ONLY with a valid JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "day": 1,
    "topic": "Topic Name",
    "description": "What the learner will cover",
    "estimatedHours": ${Math.min(2, hoursForThisSkill)},
    "importance": 5,
    "isSplittable": false
  }
]

Generate exactly ${targetDays} entries. Remember: estimatedHours MUST NOT exceed ${hoursForThisSkill}.`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let content = response.text().trim();

        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON from response
        let topics;
        try {
            topics = JSON.parse(content);
        } catch (parseError) {
            // Try to extract JSON array from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                topics = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        // Ensure all topics have importance and isSplittable fields
        topics = topics.map((topic, index) => ({
            ...topic,
            importance: topic.importance || 3,
            isSplittable: topic.isSplittable !== undefined ? topic.isSplittable : true
        }));

        return topics;
    } catch (error) {
        console.error('AI Topic Generation Error:', error);
        // Fallback to rule-based generation
        return generateRuleBasedTopics({ skillName, targetDays, dailyHours });
    }
};

/**
 * Rule-based fallback for topic generation
 */
const generateRuleBasedTopics = ({ skillName, targetDays, dailyHours }) => {
    const phases = [
        { name: 'Fundamentals', ratio: 0.3 },
        { name: 'Core Concepts', ratio: 0.4 },
        { name: 'Advanced Topics', ratio: 0.2 },
        { name: 'Practice & Projects', ratio: 0.1 }
    ];

    const topics = [];
    let currentDay = 1;

    phases.forEach((phase, phaseIndex) => {
        const daysInPhase = Math.max(1, Math.round(targetDays * phase.ratio));

        for (let i = 0; i < daysInPhase && currentDay <= targetDays; i++) {
            topics.push({
                day: currentDay,
                topic: `${skillName} - ${phase.name} Part ${i + 1}`,
                description: `Learn ${phase.name.toLowerCase()} of ${skillName}. Focus on understanding and practice.`,
                estimatedHours: Math.min(dailyHours, 2)
            });
            currentDay++;
        }
    });

    // Fill remaining days if any
    while (topics.length < targetDays) {
        topics.push({
            day: topics.length + 1,
            topic: `${skillName} - Review & Practice`,
            description: `Review learned concepts and practice through exercises.`,
            estimatedHours: Math.min(dailyHours, 2)
        });
    }

    return topics.slice(0, targetDays);
};

/**
 * Generate YouTube search queries for a topic
 * @param {string} topic - The topic to search for
 * @param {string} skillName - The overall skill name
 * @returns {Promise<Array>} Array of YouTube resource suggestions
 */
const generateYouTubeQueries = async (topic, skillName) => {
    const prompt = `Generate 3-5 YouTube search queries to find the best tutorial videos for learning:
Topic: "${topic}"
Skill: "${skillName}"

Respond ONLY with a valid JSON array of search queries (no markdown, no code blocks):
["query 1", "query 2", "query 3"]`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let content = response.text().trim();

        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let queries;
        try {
            queries = JSON.parse(content);
        } catch (parseError) {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                queries = JSON.parse(jsonMatch[0]);
            } else {
                queries = [`${skillName} ${topic} tutorial`, `Learn ${topic} for beginners`];
            }
        }

        // Convert queries to resource objects
        return queries.map((query, index) => ({
            title: query,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            type: 'youtube'
        }));
    } catch (error) {
        console.error('YouTube Query Generation Error:', error);
        return [
            {
                title: `${skillName} ${topic} tutorial`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skillName} ${topic} tutorial`)}`,
                type: 'youtube'
            },
            {
                title: `Learn ${topic} step by step`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`Learn ${topic} step by step`)}`,
                type: 'youtube'
            }
        ];
    }
};

/**
 * Generate complete learning plan with tasks
 * @param {Object} params - Planning parameters
 * @param {number} params.availableHoursPerSkill - Hours available for this skill (optional, defaults to full dailyLearningHours)
 * @returns {Promise<Object>} Complete learning plan
 */
const generateLearningPlan = async ({ skill, user, availableHoursPerSkill }) => {
    const { name: skillName, targetDays, startDate } = skill;
    const { dailyLearningHours, existingSkills } = user.profile;

    // Use provided available hours or default to full daily learning hours
    const hoursForThisSkill = availableHoursPerSkill || dailyLearningHours;

    // Generate daily topics using AI
    const dailyTopics = await generateDailyTopics({
        skillName,
        targetDays,
        dailyHours: dailyLearningHours,
        availableHoursPerSkill: hoursForThisSkill,
        existingSkills
    });

    // Cap estimated hours in case AI doesn't respect the limit
    const cappedTopics = dailyTopics.map(topic => ({
        ...topic,
        estimatedHours: Math.min(topic.estimatedHours, hoursForThisSkill)
    }));

    // Generate tasks with resources
    const tasks = [];
    const currentDate = new Date(startDate);

    for (const topic of cappedTopics) {
        const resources = await generateYouTubeQueries(topic.topic, skillName);

        tasks.push({
            title: topic.topic,
            description: topic.description,
            type: 'learning',
            scheduledDate: new Date(currentDate),
            estimatedDuration: topic.estimatedHours * 60,
            importance: topic.importance || 3,
            isSplittable: topic.isSplittable !== undefined ? topic.isSplittable : true,
            skill: skill._id,
            resources,
            dayNumber: topic.day,
            topicIndex: topic.day - 1
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        dailyTopics: cappedTopics,
        tasks
    };
};

module.exports = {
    generateDailyTopics,
    generateYouTubeQueries,
    generateLearningPlan,
    generateRuleBasedTopics
};
