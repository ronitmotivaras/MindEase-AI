import React, { useState, useRef, useEffect } from "react";
import { sendMessage } from "../services/api";
import "./ChatInterface.css";

const INITIAL_MESSAGE = {
  id: 1,
  text: "Hello! I'm MindEase AI, your mental health assistant. Please describe what symptoms or feelings you're experiencing, and I'll help analyze them. What's been troubling you lately?",
  sender: "bot",
  timestamp: new Date(),
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [conversationLevel, setConversationLevel] = useState(1);
  const [collectedSymptoms, setCollectedSymptoms] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Clear session on app start - FRESH START every time
  useEffect(() => {
    // Clear all stored data for fresh start
    localStorage.removeItem("mindease_chat_history");
    sessionStorage.removeItem("chat_session_id");
    
    // Reset to initial state
    setMessages([INITIAL_MESSAGE]);
    setConversationLevel(1);
    setCollectedSymptoms([]);
    setShowResults(false);
    setAssessmentResults(null);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    // Clear everything for fresh start
    localStorage.removeItem("mindease_chat_history");
    sessionStorage.removeItem("chat_session_id");
    
    setMessages([INITIAL_MESSAGE]);
    setInputMessage("");
    setConversationLevel(1);
    setCollectedSymptoms([]);
    setShowResults(false);
    setAssessmentResults(null);
    
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleLogoClick = () => {
    handleNewChat();
  };

  // Generate level-based response
  const getLevelBasedResponse = (level, symptoms) => {
    const responses = {
      1: "Thank you for sharing. To better understand your situation, could you tell me about any other symptoms? For example, how has your sleep been lately?",
      2: "I appreciate that. Are you experiencing any changes in appetite, energy levels, or difficulty concentrating?",
      3: "Thank you. Have you noticed any changes in your social behavior - like avoiding people or feeling isolated?",
      4: `Based on what you've described, I'm seeing patterns related to: ${symptoms.length > 0 ? symptoms.join(", ") : "emotional changes"}. Do you also experience physical symptoms like tension, rapid heartbeat, or fatigue?`,
      5: "I now have a clear picture of your symptoms. I'm ready to provide your comprehensive assessment with personalized recommendations.",
    };
    return responses[level] || responses[5];
  };

  const formatDiagnosisResponse = (response) => {
    let formattedText = response.message;

    if (response.detected_symptoms && response.detected_symptoms.length > 0) {
      formattedText += `\n\n🔍 **Detected Symptoms:**\n${response.detected_symptoms
        .map((symptom) => `• ${symptom.replace(/_/g, " ")}`)
        .join("\n")}`;
    }

    if (response.conditions && response.conditions.length > 0) {
      formattedText += `\n\n🏥 **Potential Conditions:**`;
      response.conditions.forEach((condition, index) => {
        formattedText += `\n\n${index + 1}. **${condition.name}** (${condition.match_percentage}% match)`;
        formattedText += `\n   📋 ${condition.description}`;
        if (condition.severity) {
          formattedText += `\n   ⚠️ Severity: ${condition.severity}`;
        }
      });
    }

    if (response.recommendations && response.recommendations.length > 0) {
      formattedText += `\n\n💡 **Recommendations:**`;
      response.recommendations.forEach((rec, index) => {
        formattedText += `\n${index + 1}. ${rec}`;
      });
    }

    formattedText += `\n\n⚠️ **Disclaimer:** This is an AI analysis for informational purposes only. Please consult a qualified mental health professional for proper diagnosis and treatment.`;

    return formattedText;
  };

  const handleGetAssessment = async () => {
    setIsLoading(true);

    const assessmentMsg = {
      id: messages.length + 1,
      text: "🔄 Analyzing your symptoms and generating comprehensive assessment...",
      sender: "bot",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assessmentMsg]);

    try {
      const { mentalHealthAPI } = await import("../services/api");
      const diagnosis = await mentalHealthAPI.getAnalysis();

      setAssessmentResults(diagnosis);
      setShowResults(true);

      const diagnosisMessage = {
        id: messages.length + 2,
        text: formatDiagnosisResponse(diagnosis),
        sender: "bot",
        timestamp: new Date(),
        diagnosisData: diagnosis,
      };

      setMessages((prev) => [...prev.slice(0, -1), diagnosisMessage]);
    } catch (error) {
      console.error("Error getting assessment:", error);
      const errorMsg = {
        id: messages.length + 2,
        text: "❌ Sorry, there was an error generating your assessment. Please ensure the backend server is running and try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim().toLowerCase();
    
    // Check if user wants results
    if (userText.includes("show result") || userText.includes("get result") || 
        userText.includes("send result") || userText.includes("my result")) {
      setInputMessage("");
      await handleGetAssessment();
      return;
    }

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage("");
    
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const response = await sendMessage(currentInput);

      // Update collected symptoms
      if (response.detected_symptoms && response.detected_symptoms.length > 0) {
        setCollectedSymptoms((prev) => {
          const newSymptoms = [...new Set([...prev, ...response.detected_symptoms])];
          return newSymptoms;
        });
      }

      // Progress conversation level (4-5 questions before results)
      const newLevel = Math.min(conversationLevel + 1, 5);
      setConversationLevel(newLevel);

      // Generate appropriate response based on level
      let botMessageText;
      if (newLevel >= 5) {
        botMessageText = response.message || getLevelBasedResponse(newLevel, collectedSymptoms);
        botMessageText += "\n\nI now have enough information to provide your assessment. Type 'show results' or click the button below.";
      } else {
        botMessageText = response.message || getLevelBasedResponse(newLevel, collectedSymptoms);
      }

      const botMessage = {
        id: messages.length + 2,
        text: botMessageText,
        sender: "bot",
        timestamp: new Date(),
        diagnosisData: response,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: messages.length + 2,
        text: "❌ Connection error. Please make sure the backend server is running on http://localhost:5000",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const copyToClipboard = (text, messageId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadPDF = () => {
    if (!assessmentResults) return;

    const content = generatePDFContent(assessmentResults);
    
    // Create blob and auto-download
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement("a");
    const fileName = `MindEase_Report_${new Date().toISOString().split('T')[0]}.html`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePDFContent = (results) => {
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let conditionsHTML = "";
    if (results.conditions && results.conditions.length > 0) {
      results.conditions.forEach((c, index) => {
        conditionsHTML += `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #6366f1;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">${index + 1}. ${c.name}</h3>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Match Confidence:</strong> ${c.match_percentage}%</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Severity Level:</strong> ${c.severity || "Not determined"}</p>
            <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">${c.description}</p>
          </div>
        `;
      });
    }

    let symptomsHTML = "";
    if (results.detected_symptoms && results.detected_symptoms.length > 0) {
      results.detected_symptoms.forEach((s) => {
        symptomsHTML += `<li style="margin-bottom: 6px; color: #374151;">${s.replace(/_/g, " ").charAt(0).toUpperCase() + s.replace(/_/g, " ").slice(1)}</li>`;
      });
    }

    let recommendationsHTML = "";
    if (results.recommendations && results.recommendations.length > 0) {
      results.recommendations.forEach((rec, i) => {
        recommendationsHTML += `<li style="margin-bottom: 10px; color: #374151;">${rec}</li>`;
      });
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MindEase AI - Assessment Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; max-width: 800px; margin: 0 auto; color: #1f2937; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #e5e7eb; }
    .header h1 { font-size: 32px; color: #4f46e5; margin-bottom: 8px; font-weight: 700; }
    .header .subtitle { font-size: 18px; color: #6b7280; margin-bottom: 15px; }
    .header .date { font-size: 14px; color: #9ca3af; }
    .section { margin-bottom: 35px; }
    .section h2 { font-size: 20px; color: #1f2937; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    ul, ol { padding-left: 25px; }
    .disclaimer { background: #fefce8; padding: 20px; border-radius: 8px; margin-top: 40px; border: 1px solid #fef08a; }
    .disclaimer h3 { color: #854d0e; margin-bottom: 10px; font-size: 16px; }
    .disclaimer p { color: #713f12; font-size: 14px; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MindEase AI</h1>
    <p class="subtitle">Mental Health Assessment Report</p>
    <p class="date">Generated on ${date} at ${time}</p>
  </div>
  
  <div class="section">
    <h2>Detected Symptoms</h2>
    <ul>${symptomsHTML || "<li>No specific symptoms recorded</li>"}</ul>
  </div>
  
  <div class="section">
    <h2>Assessment Results</h2>
    ${conditionsHTML || "<p style='color: #6b7280;'>No specific conditions identified based on the symptoms provided.</p>"}
  </div>
  
  <div class="section">
    <h2>Recommendations</h2>
    <ol>${recommendationsHTML || "<li>Continue monitoring your mental health and practice self-care.</li>"}</ol>
  </div>
  
  <div class="disclaimer">
    <h3>Important Disclaimer</h3>
    <p>This assessment is generated by AI for informational purposes only. It is NOT a medical diagnosis. Please consult with a qualified mental health professional for proper evaluation, diagnosis, and treatment. If you are experiencing a mental health crisis, please contact emergency services or a crisis helpline immediately.</p>
  </div>
  
  <div class="footer">
    <p>MindEase AI - Mental Health Assistant</p>
    <p>This report is confidential and intended for personal use only.</p>
  </div>
</body>
</html>`;
  };

  const suggestions = [
    "I feel anxious and worried all the time",
    "I'm feeling sad and have lost interest",
    "I'm stressed and overwhelmed with work",
    "I have mood swings and feel irritable",
    "I feel isolated and avoid social situations",
    "I can't sleep well and feel exhausted",
  ];

  const renderMessageText = (text) => {
    return text.split("\n").map((line, index) => {
      const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <div key={index} dangerouslySetInnerHTML={{ __html: boldFormatted }} />;
    });
  };

  // Results Dashboard Component
  const ResultsDashboard = () => {
    if (!assessmentResults) return null;

    const getSeverityWidth = (severity) => {
      switch (severity?.toLowerCase()) {
        case "severe": return "90%";
        case "moderate": return "60%";
        case "mild": return "30%";
        default: return "15%";
      }
    };

    const getSeverityClass = (severity) => {
      switch (severity?.toLowerCase()) {
        case "severe": return "severity-severe";
        case "moderate": return "severity-moderate";
        default: return "severity-mild";
      }
    };

    const getConfidenceClass = (confidence) => {
      if (confidence >= 70) return "confidence-high";
      if (confidence >= 40) return "confidence-medium";
      return "confidence-low";
    };

    return (
      <div className="results-dashboard">
        <div className="results-header">
          <h2>📊 Your Assessment Results</h2>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {assessmentResults.conditions && assessmentResults.conditions.length > 0 ? (
          assessmentResults.conditions.map((condition, index) => (
            <div key={index} className="condition-card">
              <div className="condition-header">
                <span className="condition-name">{condition.name}</span>
                <span className={`confidence-badge ${getConfidenceClass(condition.match_percentage)}`}>
                  {condition.match_percentage}% Match
                </span>
              </div>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: "8px 0" }}>
                {condition.description}
              </p>
              {condition.severity && (
                <div className="severity-indicator">
                  <span className="severity-label">Severity:</span>
                  <div className="severity-bar">
                    <div
                      className={`severity-fill ${getSeverityClass(condition.severity)}`}
                      style={{ width: getSeverityWidth(condition.severity) }}
                    />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{condition.severity}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#6b7280" }}>
            No specific conditions identified. This is generally a positive sign!
          </p>
        )}

        {assessmentResults.recommendations && assessmentResults.recommendations.length > 0 && (
          <div className="recommendations-section">
            <h3 className="recommendations-title">💡 Recommendations</h3>
            {assessmentResults.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className={`recommendation-icon ${index === 0 ? "urgent" : index < 3 ? "info" : "general"}`}>
                  {index === 0 ? "⚡" : index < 3 ? "💭" : "✓"}
                </div>
                <span className="recommendation-text">{rec}</span>
              </div>
            ))}
          </div>
        )}

        <button className="download-btn" onClick={downloadPDF} style={{
          padding: "12px 24px",
          fontSize: "14px",
          maxWidth: "250px",
          margin: "20px auto 0"
        }}>
          Download Report
        </button>
      </div>
    );
  };

  return (
    <div className="app-wrapper">
      <div className="animated-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="gradient-orb orb-4"></div>
      </div>

      <div className="chat-app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section" onClick={handleLogoClick}>
              <div className="logo-icon-container">
                <div className="logo-glow"></div>
                <span className="logo-icon">🧠</span>
              </div>
              <div className="logo-text">
                <h1>MindEase AI</h1>
                <span className="tagline">Mental Health Assistant</span>
              </div>
            </div>
            <div className="header-actions">
              <button className="new-chat-header-btn" onClick={handleNewChat} title="New Chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>New Chat</span>
              </button>
              <div className="status-badge">
                <span className="status-dot"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
        </header>

        <div className="messages-area">
          {messages.length === 1 && !showResults ? (
            <div className="welcome-container">
              <div className="welcome-content">
                <div className="welcome-icon-wrapper">
                  <div className="icon-pulse"></div>
                  <span className="welcome-icon">🧠</span>
                </div>
                <h2 className="welcome-title">Welcome to MindEase AI</h2>
                <p className="welcome-description">
                  Share your symptoms and feelings with me. Through our conversation, I'll help identify
                  potential mental health concerns and provide personalized recommendations.
                </p>
                <div className="suggestions-grid">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-card"
                      onClick={() => {
                        setInputMessage(suggestion);
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }}
                    >
                      <span className="suggestion-icon">💭</span>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {/* Progress Indicator */}
              {!showResults && (
                <div className="progress-indicator">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`progress-step ${
                        conversationLevel >= step ? (conversationLevel > step ? "completed" : "active") : ""
                      }`}
                    />
                  ))}
                  <span style={{ marginLeft: "10px", color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
                    Question {Math.min(conversationLevel, 5)} of 5
                  </span>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`message-bubble ${message.sender === "user" ? "user" : "bot"}`}>
                  <div className="message-inner">
                    <div className="message-avatar">
                      {message.sender === "bot" ? (
                        <div className="avatar-bot"><span>🧠</span></div>
                      ) : (
                        <div className="avatar-user">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{renderMessageText(message.text)}</div>
                      {message.sender === "bot" && (
                        <div className="message-actions">
                          <button
                            className="action-icon-btn"
                            onClick={() => copyToClipboard(message.text, message.id)}
                            title="Copy"
                          >
                            {copiedId === message.id ? (
                              <span style={{ fontSize: "11px" }}>Copied!</span>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message-bubble bot">
                  <div className="message-inner">
                    <div className="message-avatar">
                      <div className="avatar-bot"><span>🧠</span></div>
                    </div>
                    <div className="message-content">
                      <div className="typing-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show Results Dashboard */}
              {showResults && <ResultsDashboard />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Assessment Button - Show after level 4-5 */}
        {conversationLevel >= 4 && !showResults && messages.length > 1 && (
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.15) 100%)",
            borderTop: "1px solid rgba(192, 132, 252, 0.2)",
            display: "flex",
            justifyContent: "center",
          }}>
            <button
              onClick={handleGetAssessment}
              disabled={isLoading}
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "white",
                border: "none",
                padding: "14px 32px",
                borderRadius: "30px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 6px 25px rgba(139, 92, 246, 0.4)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              <span style={{ fontSize: "18px" }}>📊</span>
              <span>{isLoading ? "Generating Assessment..." : "Get My Assessment Results"}</span>
            </button>
          </div>
        )}

        <div className="input-area">
          <form className="input-form" onSubmit={handleSendMessage}>
            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="message-input"
                  placeholder={showResults ? "Start a new chat to begin again..." : "Describe your symptoms or feelings..."}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && inputMessage.trim()) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={isLoading || showResults}
                  rows="1"
                />
                <button
                  type="submit"
                  className={`send-btn ${inputMessage.trim() ? "active" : ""}`}
                  disabled={!inputMessage.trim() || isLoading || showResults}
                >
                  {isLoading ? (
                    <div className="send-spinner"></div>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  )}
                </button>
              </div>
              <div className="input-footer">
                <span className="input-hint">
                  {showResults ? "Click 'New Chat' to start over" : "Press Enter to send • Shift+Enter for new line"}
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
