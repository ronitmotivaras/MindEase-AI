const API_BASE_URL = "http://localhost:5000/api";

// Main chat function
export const sendMessage = async (userMessage) => {
  try {
    // Always get or create session ID
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

    // Handle crisis response
    if (data.response?.type === "crisis") {
      return {
        message: data.response.message,
        detected_symptoms: data.symptoms_detected || [],
        conditions: [],
        recommendations: ["Please contact emergency services or a crisis hotline immediately"],
        confidence: 1.0,
        type: "crisis"
      };
    }

    // Return formatted response
    return {
      message: data.response?.message || data.response || "I understand. Please continue sharing.",
      detected_symptoms: data.symptoms_detected || [],
      conditions: [],
      recommendations: [],
      confidence: 0.8,
      level: data.response?.level || 1,
      type: data.response?.type || "follow_up"
    };
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};

// Mental Health API functions
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

      if (!response.ok) throw new Error("Failed to get analysis");
      const data = await response.json();

      const results = data.results;

      return {
        message: "Based on our conversation, here is your mental health assessment:",
        detected_symptoms: Array.from(
          new Set(results.conditions_identified?.flatMap((c) => c.matched_symptoms) || [])
        ),
        conditions: results.conditions_identified?.map((condition) => ({
          name: condition.condition,
          match_percentage: Math.round(condition.confidence),
          description: condition.description,
          matched_symptoms: condition.matched_symptoms || [],
          severity: condition.severity,
        })) || [],
        recommendations: results.recommendations?.map((rec) => rec.message) || [],
        confidence: results.conditions_identified?.[0]?.confidence / 100 || 0,
        assessment_date: results.assessment_date,
        ml_powered: results.ml_powered
      };
    } catch (error) {
      console.error("Error getting analysis:", error);
      throw error;
    }
  },

  // Clear session - for fresh start
  clearSession: () => {
    sessionStorage.removeItem("chat_session_id");
    localStorage.removeItem("mindease_chat_history");
  },

  // Start new session
  startSession: async (type = "chat") => {
    try {
      // Clear any existing session first
      sessionStorage.removeItem("chat_session_id");
      
      const response = await fetch(`${API_BASE_URL}/start-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) throw new Error("Failed to start session");
      const data = await response.json();
      
      sessionStorage.setItem("chat_session_id", data.session_id);
      return data;
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  },

  // Get all conditions
  getConditions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conditions`);
      if (!response.ok) throw new Error("Failed to get conditions");
      return await response.json();
    } catch (error) {
      console.error("Error getting conditions:", error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await fetch(`http://localhost:5000/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};
