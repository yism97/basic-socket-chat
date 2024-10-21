import * as React from 'react';
import Sheet from '@mui/joy/Sheet';

import MessagesPane from './MessagesPane';
import ChatsPane from './ChatsPane';
import {ChatProps} from '../types';
import {chats} from '../data';
import {useEffect, useRef, useState} from "react";
import {io} from "socket.io-client";
import {Socket} from "socket.io-client/build/esm/socket";

export default function MyProfile() {
    const [socket, setSocket] = useState<Socket | null>(null);
    // const [messages, setMessages] = useState<ChatProps['messages']>([]);
    const messagesEndRef = useRef(null);

    // @ts-ignore
    useEffect(() => {
        const newSocket = io('/');
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('SEND_MESSAGE', (msg) => {
                if (typeof msg === 'string') {
                    msg = JSON.parse(msg);
                }
                console.log(typeof msg)
                console.log(msg)
                // const newMessage = JSON.parse(msg);
                setSelectedChat((prevMessages) => {
                    return {
                        ...prevMessages,
                        messages: [...prevMessages.messages, msg],
                    };
                });
                chats[0].messages.push(msg);
            });
        }
    }, [socket]);

    const sendMessage = (message) => {
        if (socket) {
            console.log('sending message');
            socket.emit('SEND_MESSAGE', message);
        }
    }

    const [selectedChat, setSelectedChat] = React.useState<ChatProps>({
        messages: [],
        sender: {
            name: '',
            username: '',
            avatar: '',
            online: false,
        },
        id: '',
    });
    return (
        <Sheet
            sx={{
                flex: 1,
                width: '100%',
                mx: 'auto',
                pt: {xs: 'var(--Header-height)', md: 0},
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'minmax(min-content, min(30%, 400px)) 1fr',
                },
            }}
        >
            <Sheet
                sx={{
                    position: {xs: 'fixed', sm: 'sticky'},
                    transform: {
                        xs: 'translateX(calc(100% * (var(--MessagesPane-slideIn, 0) - 1)))',
                        sm: 'none',
                    },
                    transition: 'transform 0.4s, width 0.4s',
                    zIndex: 100,
                    width: '100%',
                    top: 52,
                }}
            >
                <ChatsPane
                    chats={chats}
                    selectedChatId={selectedChat.id}
                    setSelectedChat={setSelectedChat}
                />
            </Sheet>
            <MessagesPane
                id={selectedChat.id}
                messages={selectedChat.messages}
                sender={selectedChat.sender}
                onSendButtonClick={(message) => {
                    sendMessage(message);
                }}
            />
        </Sheet>
    );
}
