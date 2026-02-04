import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
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
        text: "I've generated your detailed assessment below.",
        sender: "bot",
        timestamp: new Date(),
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

      // Update collected symptoms and keep a local copy for follow-up message
      let updatedSymptoms = collectedSymptoms;
      if (response.detected_symptoms && response.detected_symptoms.length > 0) {
        const allSymptomsSet = new Set([
          ...collectedSymptoms,
          ...response.detected_symptoms,
        ]);
        updatedSymptoms = Array.from(allSymptomsSet);
        setCollectedSymptoms(updatedSymptoms);
      }

      // Progress conversation level (4-5 questions before results)
      const newLevel = Math.min(conversationLevel + 1, 5);
      setConversationLevel(newLevel);

      // Generate appropriate response based on level
      let botMessageText;
      if (newLevel >= 5) {
        botMessageText =
          response.message || getLevelBasedResponse(newLevel, updatedSymptoms);
        botMessageText +=
          "\n\nI now have enough information to provide your assessment. Click the button below to view your detailed results.";
      } else {
        botMessageText =
          response.message || getLevelBasedResponse(newLevel, updatedSymptoms);
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

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    const addSectionTitle = (title) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(title, 15, y);
      y += 5;
      pdf.setLineWidth(0.3);
      pdf.line(15, y, pageWidth - 15, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
    };

    const addWrappedText = (text, leftMargin = 15, maxWidth = pageWidth - 30) => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, leftMargin, y);
        y += 6;
      });
      y += 2;
    };

    // Header - centered highlighted app name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    const title = "MindEase-AI";
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, y);
    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(13);
    pdf.text("Mental Health Assessment Report", pageWidth / 2, y, { align: "center" });
    y += 10;

    const generatedAt = new Date();
    const dateStr = generatedAt.toLocaleDateString();
    const timeStr = generatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    pdf.setFontSize(10);
    pdf.text(`Generated on ${dateStr} at ${timeStr}`, pageWidth / 2, y, { align: "center" });
    y += 10;

    pdf.setLineWidth(0.5);
    pdf.line(15, y, pageWidth - 15, y);
    y += 10;

    // Summary section (top condition if available)
    addSectionTitle("Clinical Summary");
    if (assessmentResults.conditions && assessmentResults.conditions.length > 0) {
      const primary = assessmentResults.conditions[0];
      addWrappedText(
        `Based on the reported symptoms, the most likely mental health concern is "${primary.name}" with an estimated match of ${primary.match_percentage}%.`
      );
      if (primary.severity) {
        addWrappedText(`Overall severity is assessed as: ${primary.severity}.`);
      }
      if (primary.description) {
        addWrappedText(primary.description);
      }
    } else {
      addWrappedText(
        "No specific mental health condition could be confidently identified from the reported symptoms. This is generally reassuring, but monitoring and self-care are still recommended."
      );
    }

    // Detected symptoms section
    addSectionTitle("Reported / Detected Symptoms");
    if (assessmentResults.detected_symptoms && assessmentResults.detected_symptoms.length > 0) {
      const symptoms = assessmentResults.detected_symptoms.map((s) => {
        const clean = s.replace(/_/g, " ");
        return clean.charAt(0).toUpperCase() + clean.slice(1);
      });
      addWrappedText(`The following key symptoms were identified:`);
      symptoms.forEach((symptom) => {
        addWrappedText(`• ${symptom}`);
      });
    } else {
      addWrappedText("No distinct symptoms were automatically detected in the conversation.");
    }

    // Detailed conditions section
    addSectionTitle("Differential Assessment");
    if (assessmentResults.conditions && assessmentResults.conditions.length > 0) {
      assessmentResults.conditions.forEach((condition, index) => {
        addWrappedText(
          `${index + 1}. ${condition.name} (${condition.match_percentage}% match${
            condition.severity ? `, ${condition.severity} severity` : ""
          })`
        );
        if (condition.description) {
          addWrappedText(`   Summary: ${condition.description}`);
        }
      });
    } else {
      addWrappedText(
        "No specific mental health diagnoses are suggested at this time based on the available information."
      );
    }

    // Recommendations section
    addSectionTitle("Clinical Recommendations");
    if (assessmentResults.recommendations && assessmentResults.recommendations.length > 0) {
      assessmentResults.recommendations.forEach((rec, index) => {
        addWrappedText(`${index + 1}. ${rec}`);
      });
    } else {
      addWrappedText(
        "Consider maintaining a healthy routine, monitoring your mood over time, and seeking professional support if symptoms persist or worsen."
      );
    }

    // Disclaimer section
    addSectionTitle("Important Disclaimer");
    addWrappedText(
      "This document is generated by an AI system (MindEase-AI) for informational and educational purposes only. It is not a formal medical or psychiatric diagnosis. Clinical evaluation by a licensed mental health professional is essential before making any decisions about treatment or care. If you are in crisis or having thoughts of self-harm, please contact emergency services or a crisis helpline immediately."
    );

    pdf.save(`MindEase_Report_${generatedAt.toISOString().split("T")[0]}.pdf`);
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
              {showResults && (
                <div id="report-content">
                  <ResultsDashboard />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Assessment Button - Show after 5 conversation levels */}
        {conversationLevel >= 5 && !showResults && messages.length > 1 && (
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
