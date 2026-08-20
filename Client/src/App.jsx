import { useEffect, useRef, useState } from "react";
import useVoiceRecorder from "../src/hooks/useVoiceRecorder";

function App() {
  const ws = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [message, setMessage] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const { isRecording, audioBlob, startRecording, stopRecording } =
    useVoiceRecorder();

  useEffect(() => {
    if (!audioBlob) return;

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    console.log("Sending audio to server...", audioBlob.size);

    ws.current.send(audioBlob);
  }, [audioBlob]);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:5000");

    ws.current.onopen = () => {
      console.log("Connected to websocket");
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log("Server message:", data);

      if (data.type == "ai_message") {
        setMessage((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.message,
          },
        ]);
      }
      if (data.type == "call_ended") {
        setIsCallActive(false);
      }
    };
    ws.current.onclose = () => {
      console.log("websocket disconnected");
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.log("websocket error:", error);
    };
    return () => {
      ws.current?.close();
    };
  }, []);

  const startCall = () => {
    if (!isConnected) {
      alert("server is not connected");
    }
    setMessage([]);
    setIsCallActive(true);

    ws.current.send(
      JSON.stringify({
        type: "start_call",
      }),
    );
  };

  const sendMessage = () => {
    if (!userMessage.trim()) return;
    const message = userMessage.trim();

    setMessage((prev) => [
      ...prev,
      {
        role: "user",
        text: message,
      },
    ]);
    ws.current.send(
      JSON.stringify({
        type: "user_message",
        message,
      }),
    );
    setUserMessage("");
  };

  const endCall = () => {
    ws.current.send(
      JSON.stringify({
        type: "end_call",
      }),
    );
    setIsCallActive(false);
  };

  return (
    <>
      <div className="app">
        <div className="call-card">
          <div className="header">
            <div>
              <h1>Health Voice AI</h1>
              <p>Your AI health screening assistant</p>
            </div>

            <div className={`status ${isConnected ? "online" : "offline"}`}>
              <span></span>
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>

          {!isCallActive ? (
            <div className="start-screen">
              <div className="ai-icon">🤖</div>

              <h2>Ready for your health screening?</h2>

              <p>
                Start a voice conversation with our AI assistant. The assistant
                will ask you a few basic health questions.
              </p>

              <button
                className="start-button"
                onClick={startCall}
                disabled={!isConnected}
              >
                Start Call
              </button>
            </div>
          ) : (
            <div className="call-screen">
              <div className="call-status">
                <span className="pulse"></span>
                Call in progress
              </div>

              <div className="messages">
                {message.map((message, index) => (
                  <div key={index} className={`message ${message.role}`}>
                    <strong>
                      {message.role === "assistant" ? "AI Assistant" : "You"}
                    </strong>
                    <p>{message.text}</p>
                  </div>
                ))}
              </div>
              <div className="voice-controls">
                {!isRecording ? (
                  <button className="voice-button" onClick={startRecording}>
                    🎤 Speak
                  </button>
                ) : (
                  <button className="stop-button" onClick={stopRecording}>
                    ⏹ Stop Recording
                  </button>
                )}

                {isRecording && (
                  <p className="recording-status">🔴 Listening...</p>
                )}

                {audioBlob && !isRecording && (
                  <p className="recording-status success">
                    ✓ Voice recorded successfully
                  </p>
                )}
              </div>

              <button className="end-button" onClick={endCall}>
                End Call
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
