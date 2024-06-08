import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io("/");

export default function App() {
  const [messages, setMessages] = useState(() => {
    const storedMessages = localStorage.getItem("messages");
    return storedMessages ? JSON.parse(storedMessages) : [];
  });
  const [message, setMessage] = useState("");
  const [nick, setNick] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isNickSet, setIsNickSet] = useState(false);
  const [userList, setUserList] = useState([]);
  const messagesContainerRef = useRef(null);



  useEffect(() => {
    if (!isNickSet && !nick) {
      const userNick = localStorage.getItem("userNick");
      if (userNick) {
        setNick(userNick);
        setIsNickSet(true);
        socket.emit("setNick", userNick);
      } else {
        let newNick = '';
        while (newNick === null || newNick === "") {
          newNick = prompt("Ingrese su Nombre de usuario:");
          if (newNick === null || newNick === "") {
            alert("Ingrese un nombre de usuario valido");
          }
        }
        setNick(newNick);
        setIsNickSet(true);
        localStorage.setItem("userNick", newNick);
        socket.emit("setNick", newNick);
      }
    }

    socket.on("message", receiveMessage);
    socket.on("updateUserList", updateUserList);

    return () => {
      socket.off("message", receiveMessage);
      socket.off("updateUserList", updateUserList);
    };
  }, [isNickSet, nick]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  const receiveMessage = (message) => {
    setMessages((state) => [...state, message]);

    if (message.from === selectedUser) {
      return;
    }

    alert(`Nuevo mensaje de ${message.from}` );

  };

  const updateUserList = (users) => {
    setUserList(users);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newMessage = {
      body: message,
      from: nick,
      to: selectedUser,
      timestamp: new Date().toLocaleString(),
    };
    setMessages((state) => [...state, newMessage]);
    setMessage("");
    socket.emit("message", newMessage);

  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const userLoggout = () => {
    localStorage.clear();
    alert("Has cerrado Sesion exitosamente...")
    window.location.reload();
  };
  const userLogged = localStorage.getItem("userNick");



  return (

    <div>
      <div className="bg-zinc-800 text-white " style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px",
      }}>
        <h1 style={{
          fontSize: "30px",
        }}>{userLogged}</h1>
        <button type="submit" className="bg-red-500"
          style={{
            borderRadius: "5px",
            padding: "10px"
          }}
          onClick={userLoggout}
        >cerrar sesion</button>
      </div>

      <div className="max-h-full bg-zinc-800 text-white flex ">
        <div className="w-1/4 p-4 bg-zinc-900 rounded-md " >

          <h2 className="text-xl font-bold mb-6">Usuarios Conectados</h2>
          <ul>
            {userList.map((user, index) => (
              <li
                key={index}
                className={`mb-2 cursor-pointer ${selectedUser === user ? "bg-blue-500" : ""
                  }`}
                onClick={() => handleUserClick(user)}
              >
                {user}
              </li>
            ))}
          </ul>
        </div>



        <div className="flex-1 p-4 overflow-auto">
          <div
            className="flex flex-col h-screen"
            style={{
              maxHeight: "calc(100vh - 8rem)",
              overflowY: "scroll",
              background: "white",
              borderRadius: '50px  '
            }}
            ref={messagesContainerRef}
          >
            <ul style={{
              padding: '10px'
            }}>
              {messages
                .filter(
                  (msg) =>
                    (msg.from === selectedUser && msg.to === nick) ||
                    (msg.from === nick && msg.to === selectedUser)
                )
                .map((msg, index) => (
                  <li
                    key={index}
                    className={`my-2 p-2 table text-sm rounded-md ${msg.from === nick ? "bg-sky-700 ml-auto" : "bg-black"
                      }`}
                  >
                    <b>{msg.from}</b>: {msg.body}
                    <br />
                    <span className="text-xs text-gray-400">{msg.timestamp}</span>
                  </li>
                ))}
            </ul>
          </div>


          <form onSubmit={handleSubmit} className="bg-zinc-900 p-4 mt-6">
            <div style={{
              display: "flex",
              alignItems: "center"
            }}>
              <input
                style={{
                  borderRadius: "5px",
                }}
                name="message"
                type="text"
                placeholder={`Chatea con ${selectedUser || "Choucair"}...`}
                onChange={(e) => setMessage(e.target.value)}
                className="border-2 border-zinc-500 p-2 w-full text-black"
                value={message}
                autoFocus
              />
              <button type="submit" className="bg-blue-500 text-white p-2 ml-2">   Enviar  </button>

            </div>

          </form>
        </div>

      </div>
    </div>

  );
}
