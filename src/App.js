import React from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./App.scss";
import Mic from "./icons/mic.png";
import Mute from "./icons/mute.png";
import { interact } from "./apis/Server";

function App() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const messagesEndRef = React.useRef(null)
  const [transcriptText, setTranscriptText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [conversation, setConversation] = React.useState([
    {
      text: "Hi there, how may I help you?",
      self: false,
      time: `${new Date().getHours()}:${new Date().getMinutes()}`,
    }
  ]);

  React.useEffect(() => {
    setTranscriptText(transcript);
  }, [transcript]);

  React.useEffect(()=>{
      scrollToBottom()
  }, [conversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = async () => {
    const payloadText = transcriptText.trim();
    setTranscriptText("");
    resetTranscript();
    setLoading(true);

    setConversation(conversation => [...conversation, {self: true, time: `${new Date().getHours()}:${new Date().getMinutes()}`, text: payloadText}])

    const message = await interact(payloadText);
  
    setLoading(false);
    setConversation(conversation => [...conversation, {self: false, time: `${new Date().getHours()}:${new Date().getMinutes()}`, text: message}])
  };

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening();
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <>
      <div className="chat">
        <div className="chat-title">
          <h1>Hedylogos</h1>
          <h2>Online</h2>
          <figure className="avatar">
            <img src="https://logos-download.com/wp-content/uploads/2021/01/PhonePe_Logo.png" alt=""/>
          </figure>
        </div>

        <div className="messages">
          <div className="messages-content">
            {conversation.map((message, index) => {
              return message.self ? (
                <div className="message message-personal" key={index}>
                  {message.text}
                  <div className="timestamp">{message.time}</div>
                </div>
              ) : (
                <div className="message new" key={index}>
                  <figure className="avatar">
                    <img src="https://logos-download.com/wp-content/uploads/2021/01/PhonePe_Logo.png" alt=""/>
                  </figure>
                  {message.text}
                  <div className="timestamp">{message.time}</div>
                </div>
              );
            })}
            {loading && (
              <div className="message loading new">
                <figure className="avatar">
                  <img src="https://logos-download.com/wp-content/uploads/2021/01/PhonePe_Logo.png" alt=""/>
                </figure>
                <span></span>
              </div>
            )}
            <div ref={messagesEndRef} style={{float:'left'}}/>
          </div>
        </div>

        <div className="message-box">
          <textarea
            type="text"
            className="message-input"
            placeholder="Type message..."
            value={transcriptText}
            onChange={(e) => {
              setTranscriptText(e.target.value);
            }}
          ></textarea>

          {transcriptText && (
            <button type="submit" className="message-send" onClick={handleSend}>
              {"Send"}
            </button>
          )}
          <button
            type="submit"
            className="message-submit"
            style={listening ? { background: "#b83232" } : {}}
            onClick={handleMicClick}
          >
            <img
              src={listening ? Mute : Mic}
              style={{ height: 12, width: 12 }}
              alt=""
            />
          </button>
        </div>
      </div>

      <div className="bg"></div>
    </>
  );
}

export default App;
