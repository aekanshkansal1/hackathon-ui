import React, { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./App.scss";
import Mic from "./icons/mic.png";
import Mute from "./icons/mute.png";
import { IoMdSend } from 'react-icons/io';
import { interact } from "./apis/Server";
import monster_img from './icons/monster_still1.png';
import { IconContext } from 'react-icons'


let allVoices = []
const initSpeech = new SpeechSynthesisUtterance();
window.speechSynthesis.onvoiceschanged = () => {
  allVoices = window.speechSynthesis.getVoices();
  console.log(allVoices);
};

const speechUtteranceChunker = function (utt, settings, callback) {
  settings = settings || {};
  let newUtt;
  let txt = (settings && settings.offset !== undefined ? utt.text.substring(settings.offset) : utt.text);
  if (utt.voice && utt.voice.voiceURI === 'native') { // Not part of the spec
      newUtt = utt;
      newUtt.text = txt;
      newUtt.addEventListener('end', function () {
          if (speechUtteranceChunker.cancel) {
              speechUtteranceChunker.cancel = false;
          }
          if (callback !== undefined) {
              callback();
          }
      });
  }
  else {
      let chunkLength = (settings && settings.chunkLength) || 160;
      let pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
      let chunkArr = txt.match(pattRegex);
      if (chunkArr[0] === undefined || chunkArr[0].length <= 2) {
          //call once all text has been spoken...
          if (callback !== undefined) {
              callback();
          }
          return;
      }
      let chunk = chunkArr[0];
      newUtt = new SpeechSynthesisUtterance(chunk);
      let x;
      for (x in utt) {
          if (utt.hasOwnProperty(x) && x !== 'text') {
              newUtt[x] = utt[x];
          }
      }
      newUtt.addEventListener('end', function () {
          if (speechUtteranceChunker.cancel) {
              speechUtteranceChunker.cancel = false;
              return;
          }
          settings.offset = settings.offset || 0;
          settings.offset += chunk.length - 1;
          speechUtteranceChunker(utt, settings, callback);
      });
  }
  if (settings.modifier) {
      settings.modifier(newUtt);
  }
  console.log(newUtt); //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
  //placing the speak invocation inside a callback fixes ordering and onend issues.
  setTimeout(function () {
      newUtt.voice = allVoices[145];
      speechSynthesis.speak(newUtt);
  }, 0);
};

function App() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  function speak(message) {
    const speech = new SpeechSynthesisUtterance(message);
    const voiceArr = window.speechSynthesis.getVoices();
    speech.voice = voiceArr[145];
    
    speechUtteranceChunker(speech, {
      chunkLength: 120
    }, function() {
      console.log('spoken')
      setIsSpeaking(false);
    });
  }
  
  const [isSpeaking, setIsSpeaking] = useState(false);
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
    setIsSpeaking(false);
    const payloadText = transcriptText.trim();
    setTranscriptText("");
    resetTranscript();
    setLoading(true);
    setConversation(conversation => [...conversation, {self: true, time: `${new Date().getHours()}:${new Date().getMinutes()}`, text: payloadText}])

    const message = await interact(payloadText);
  	    
    //text to speech
    setIsSpeaking(true);
    speak(message);
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
          <h1>PhonePe Insurance</h1>
          <h2>Online</h2>
          <figure className="avatar">
            <img src="https://logos-download.com/wp-content/uploads/2021/01/PhonePe_Logo.png" alt=""/>
          </figure>
        </div>

        <div className="messages">
          <div className="smiley">

            <div class="main">
              <div class="monster">
              { isSpeaking ? 
                              <div class="monster__face">
                              <div class="monster__eyes">
                                <div class="monster__eye"></div>
                                <div class="monster__eye"></div>
                              </div>
                              <div class="monster__mouth">
                                <div class="monster__top"></div>
                                <div class="monster__bottom"></div>
                              </div>
                            </div>
              :
                    <img src={monster_img} className="still_monster" />
          }
              </div>
            </div>
          </div>

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
                  <IconContext.Provider
      value={{ size: '25px' }}
    >
      <IoMdSend />
    </IconContext.Provider>

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
              style={{ height: 24, width: 24 }}
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
