import React, { useState, useRef, useEffect } from "react";
import { sendMessage } from "../services/api";
import "./ChatInterface.css";

const INITIAL_MESSAGE = {
  id: 1,
  text: "Hello! I'm MindEase AI, your mental health assistant. I can help analyze your symptoms and provide insights about potential mental health conditions. Please describe how you're feeling or what symptoms you're experiencing.",
  sender: "bot",
  timestamp: new Date(),
};

const STORAGE_KEY = "mindease_chat_history";

const ChatInterface = () => {
  // Load messages from localStorage or use initial message
  const loadMessages = () => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
    }
    return [INITIAL_MESSAGE];
  };

  const [messages, setMessages] = useState(loadMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showAssessmentBtn, setShowAssessmentBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);

  // Show assessment button after user has sent at least 3 messages
  useEffect(() => {
    const userMessages = messages.filter((m) => m.sender === "user");
    setShowAssessmentBtn(userMessages.length >= 3);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle new chat - reset to initial message
  const handleNewChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInputMessage("");
    setShowAssessmentBtn(false);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // Clear backend session
    import("../services/api")
      .then(({ mentalHealthAPI }) => {
        mentalHealthAPI.clearSession();
      })
      .catch((err) => console.error("Error clearing session:", err));
  };

  // Handle logo/project name click - refresh/reset
  const handleLogoClick = () => {
    window.location.reload();
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
        formattedText += `\n\n${index + 1}. **${condition.name}** (${
          condition.match_percentage
        }% confidence)`;
        formattedText += `\n   📋 ${condition.description}`;
        if (condition.severity) {
          formattedText += `\n   ⚠️ Severity: ${condition.severity}`;
        }
        if (
          condition.matched_symptoms &&
          condition.matched_symptoms.length > 0
        ) {
          formattedText += `\n   ✓ Matching symptoms: ${condition.matched_symptoms.join(
            ", "
          )}`;
        }
      });
    }

    if (response.recommendations && response.recommendations.length > 0) {
      formattedText += `\n\n💡 **Recommendations:**`;
      response.recommendations.forEach((rec, index) => {
        formattedText += `\n${index + 1}. ${rec}`;
      });
    }

    if (response.dataset_insights) {
      const insights = response.dataset_insights;
      formattedText += `\n\n📊 **Dataset Insights:**`;

      if (insights.treatment_seeking) {
        formattedText += `\n• ${insights.treatment_seeking.yes.toFixed(
          1
        )}% of people with similar symptoms seek treatment`;
      }

      if (insights.family_history) {
        formattedText += `\n• ${insights.family_history.yes.toFixed(
          1
        )}% have a family history of mental health issues`;
      }

      if (insights.work_impact) {
        formattedText += `\n• ${insights.work_impact.affected.toFixed(
          1
        )}% report work performance being affected`;
      }
    }

    if (response.confidence !== undefined) {
      formattedText += `\n\n⚡ **Confidence Level:** ${(
        response.confidence * 100
      ).toFixed(1)}%`;
    }

    formattedText += `\n\n⚠️ **Important:** This is an AI analysis for informational purposes only. Please consult with a qualified mental health professional for proper diagnosis and treatment.`;

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

      const diagnosisMessage = {
        id: messages.length + 2,
        text: formatDiagnosisResponse(diagnosis),
        sender: "bot",
        timestamp: new Date(),
        diagnosisData: diagnosis,
      };

      // Replace the "Analyzing..." message with the actual diagnosis
      setMessages((prev) => [...prev.slice(0, -1), diagnosisMessage]);
      setShowAssessmentBtn(false);
    } catch (error) {
      console.error("Error getting assessment:", error);
      const errorMsg = {
        id: messages.length + 2,
        text: "❌ Sorry, I had trouble generating the assessment. This could be because:\n\n• The backend server is not running\n• There was a network error\n• Not enough conversation data\n\nPlease make sure the Python backend is running on http://localhost:5000 and try again.",
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

      // Just use the message from the backend (conversational response)
      const botMessageText =
        response.message ||
        response.text ||
        "I understand. Can you tell me more?";

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
        text: "❌ Sorry, I encountered an error. Please make sure the Python backend server is running on http://localhost:5000 and try again.\n\nTo start the backend:\n1. Open terminal in backend folder\n2. Run: venv\\Scripts\\activate\n3. Run: python app.py",
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

  const suggestions = [
    "I feel anxious and worried all the time",
    "I'm feeling sad and have lost interest in activities",
    "I'm stressed and overwhelmed with work",
    "I have mood swings and feel irritable",
    "I feel isolated and avoid social situations",
    "I can't concentrate and feel unmotivated at work",
  ];

  const renderMessageText = (text) => {
    // Simple markdown-like formatting
    return text.split("\n").map((line, index) => {
      // Handle bold text
      const boldFormatted = line.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );

      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: boldFormatted }} />
      );
    });
  };

  return (
    <div className="app-wrapper">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Main Container */}
      <div className="chat-app">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <div
              className="logo-section"
              onClick={handleLogoClick}
              style={{ cursor: "pointer" }}
            >
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
              <button
                className="new-chat-header-btn"
                onClick={handleNewChat}
                title="New Chat"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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

        {/* Messages Area */}
        <div className="messages-area">
          {messages.length === 1 ? (
            <div className="welcome-container">
              <div className="welcome-content">
                <div className="welcome-icon-wrapper">
                  <div className="icon-pulse"></div>
                  <span className="welcome-icon">🧠</span>
                </div>
                <h2 className="welcome-title">Welcome to MindEase AI</h2>
                <p className="welcome-description">
                  Describe your mental health symptoms and I'll help analyze
                  potential conditions. Start by selecting a suggestion below or
                  typing your own message.
                </p>
                <div className="suggestions-grid">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-card"
                      onClick={() => {
                        setInputMessage(suggestion);
                        // Focus the input and move cursor to end
                        setTimeout(() => {
                          if (inputRef.current) {
                            inputRef.current.focus();
                            inputRef.current.setSelectionRange(
                              suggestion.length,
                              suggestion.length
                            );
                          }
                        }, 100);
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-bubble ${
                    message.sender === "user" ? "user" : "bot"
                  }`}
                >
                  <div className="message-inner">
                    <div className="message-avatar">
                      {message.sender === "bot" ? (
                        <div className="avatar-bot">
                          <span>🧠</span>
                        </div>
                      ) : (
                        <div className="avatar-user">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-text">
                        {renderMessageText(message.text)}
                      </div>
                      {message.sender === "bot" && (
                        <div className="message-actions">
                          <button
                            className="action-icon-btn"
                            onClick={() =>
                              copyToClipboard(message.text, message.id)
                            }
                            title="Copy message"
                          >
                            {copiedId === message.id ? (
                              <span
                                style={{ fontSize: "12px", color: "#f2f7f5ff" }}
                              >
                                Copied!
                              </span>
                            ) : (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                ></rect>
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
                      <div className="avatar-bot">
                        <span>🧠</span>
                      </div>
                    </div>
                    <div className="message-content">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Assessment Button */}
        {showAssessmentBtn && messages.length > 1 && (
          <div
            style={{
              padding: "15px 20px",
              background: "rgba(255, 255, 255, 0.05)",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <button
              onClick={handleGetAssessment}
              disabled={isLoading}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                padding: "14px 32px",
                borderRadius: "30px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                opacity: isLoading ? 0.6 : 1,
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 25px rgba(102, 126, 234, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 20px rgba(102, 126, 234, 0.4)";
              }}
            >
              <span style={{ fontSize: "18px" }}>📊</span>
              <span>
                {isLoading
                  ? "Analyzing..."
                  : "Get Full Mental Health Assessment"}
              </span>
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="input-area">
          <form className="input-form" onSubmit={handleSendMessage}>
            <div className="input-container">
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="message-input"
                  placeholder="Describe your mental health symptoms..."
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      inputMessage.trim()
                    ) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={isLoading}
                  rows="1"
                />
                <button
                  type="submit"
                  className={`send-btn ${inputMessage.trim() ? "active" : ""}`}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  {isLoading ? (
                    <div className="send-spinner"></div>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  )}
                </button>
              </div>
              <div className="input-footer">
                <span className="input-hint">
                  Press Enter to send • Shift+Enter for new line
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
