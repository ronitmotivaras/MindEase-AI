const API_BASE_URL = "http://localhost:5000/api";

// Main chat function that your ChatInterface uses
export const sendMessage = async (userMessage) => {
  try {
    // Get or create session ID
    let sessionId = sessionStorage.getItem("chat_session_id");

    if (!sessionId) {
      // Start a new chat session
      const sessionResponse = await fetch(`${API_BASE_URL}/start-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat" }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to start session");
      }

      const sessionData = await sessionResponse.json();
      sessionId = sessionData.session_id;
      sessionStorage.setItem("chat_session_id", sessionId);
    }

    // Send the message to backend
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message: userMessage,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const data = await response.json();
    console.log("Backend response:", data); // Debug log

    // Check if it's a crisis response
    if (data.response?.type === "crisis") {
      return {
        message:
          data.response.message +
          "\n\n" +
          data.response.crisis_resources
            ?.map((r) => `${r.name}: ${r.phone || r.text}`)
            .join("\n"),
        detected_symptoms: data.symptoms_detected || [],
        conditions: [],
        recommendations: [
          "⚠️ Please contact emergency services or a crisis hotline immediately",
        ],
        confidence: 1.0,
      };
    }

    // Transform backend response to match your frontend format
    // Just return the conversational response - no analysis yet
    return {
      message:
        data.response?.message ||
        data.response ||
        "I understand. Can you tell me more?",
      detected_symptoms: data.symptoms_detected || [],
      conditions: [], // Don't show conditions in every message
      recommendations: [],
      confidence: 0.8,
    };
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};

// Additional API functions
export const mentalHealthAPI = {
  // Get full analysis
  getAnalysis: async () => {
    try {
      const sessionId = sessionStorage.getItem("chat_session_id");
      if (!sessionId) throw new Error("No active session");

      const response = await fetch(`${API_BASE_URL}/chat/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      console.log("Analysis response:", data); // Debug log

      // Transform to your format with full diagnosis
      const results = data.results;

      return {
        message:
          "Based on our conversation, here is your mental health assessment:",
        detected_symptoms: Array.from(
          new Set(
            results.conditions_identified?.flatMap((c) => c.matched_symptoms) ||
              []
          )
        ),
        conditions:
          results.conditions_identified?.map((condition) => ({
            name: condition.condition,
            match_percentage: Math.round(condition.confidence),
            description: condition.description,
            matched_symptoms: condition.matched_symptoms || [],
            severity: condition.severity,
          })) || [],
        recommendations:
          results.recommendations?.map((rec) => rec.message) || [],
        confidence: results.conditions_identified?.[0]?.confidence / 100 || 0,
        dataset_insights: {
          treatment_seeking: { yes: 65.0 },
          family_history: { yes: 45.0 },
          work_impact: { affected: 70.0 },
        },
      };
    } catch (error) {
      console.error("Error getting analysis:", error);
      throw error;
    }
  },

  // Clear session
  clearSession: () => {
    sessionStorage.removeItem("chat_session_id");
  },

  // Get all conditions
  getConditions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conditions`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error getting conditions:", error);
      throw error;
    }
  },
};
