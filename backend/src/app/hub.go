// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package app

import (
	"fmt"

	"github.com/gorilla/websocket"
	"github.com/waterproofpatch/go_authentication/authentication"
)

const (
	USER       = 1 // from the user
	SYSTEM     = 2 // from the client code
	SERVER     = 3 // from the server code
	USER_JOIN  = 4 // from the server code
	USER_LEAVE = 5 // from the server code
)

type Message struct {
	Content       string `json:"content"`
	From          string `json:"from"`
	Timestamp     string `json:"timestamp"`
	Channel       string `json:"channel"`
	Type          int    `json:"type"`
	Token         string `json:"token"`
	PmUsername    string `json:"pmUsername"`
	Authenticated bool   `json:"authenticated"`
}

type MessageClientTuple struct {
	Message *Message
	Client  *Client // the client (server authoritative) that send this message
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan *MessageClientTuple

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

// get a connected client by their username.
// returns nil if no such client is connected.
func (h *Hub) getClientByName(username string) *Client {
	for client := range h.clients {
		if client.username == username {
			return client
		}
	}
	return nil
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan *MessageClientTuple),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) broadcastMessage(message *Message) {
	for client := range h.clients {
		fmt.Printf("Broadcasting message to client %s\n", client.username)
		select {
		case client.send <- message:
		default:
			close(client.send)
			delete(h.clients, client)
		}
	}
}

func (h *Hub) broadcastClientLeave(username string) {
	var message Message
	message.Type = USER_LEAVE
	message.Content = username
	message.Timestamp = formattedTime()
	message.From = "Server"
	message.Channel = "Broadcast"
	message.Authenticated = true
	h.broadcastMessage(&message)
}

func (h *Hub) broadcastClientJoin(joiningClient *Client) {
	var message Message
	message.Type = USER_JOIN
	message.Content = joiningClient.username
	message.Timestamp = formattedTime()
	message.From = "Server"
	message.Channel = "Broadcast"
	message.Authenticated = true
	for _client := range h.clients {
		if _client == joiningClient {
			continue
		}
		fmt.Printf("Broadcasting USER_JOIN (%s) message to client %s\n", joiningClient.username, _client.username)
		select {
		case _client.send <- &message:
		default:
			close(_client.send)
			delete(h.clients, _client)
		}
	}
}

func (m *Message) String() string {
	return fmt.Sprintf("from=%s, channel=%s, timestamp=%s, pmUsername=%s, authenticated=%t, content=%s", m.From, m.Channel, m.Timestamp, m.PmUsername, m.Authenticated, m.Content)
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			fmt.Println("Registering client: ", client.conn.RemoteAddr().String())
			h.clients[client] = true
		case client := <-h.unregister:
			fmt.Print("Unregistering client: ", client.conn.RemoteAddr().String())
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.broadcastClientLeave(client.username)
		case messageTuple := <-h.broadcast:
			success, _, errorMsg, reason := authentication.ParseToken(messageTuple.Message.Token, false)
			if !success {
				fmt.Printf("Failed parsing token from message: %s, reason=%s\n", errorMsg, reason)
				cm := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Not authenticated.")
				if err := messageTuple.Client.conn.WriteMessage(websocket.CloseMessage, cm); err != nil {
					fmt.Printf("Error in broadcast, failed parsing token: %v\n", err)
				}
				messageTuple.Client.conn.Close()

				if _, ok := h.clients[messageTuple.Client]; ok {
					delete(h.clients, messageTuple.Client)
					close(messageTuple.Client.send)
				}
				h.broadcastClientLeave(messageTuple.Client.username)
				break
			} else {
				fmt.Printf("Message is from an authenticated user.")
				messageTuple.Message.Authenticated = true
			}

			messageTuple.Message.From = messageTuple.Client.username
			messageTuple.Message.Timestamp = formattedTime()
			messageTuple.Message.Token = "" // dont send tokens to other clients
			messageTuple.Message.Type = USER

			fmt.Printf("%v", messageTuple.Message)

			err := AddMessage(authentication.GetDb(), messageTuple.Message)
			if err != nil {
				fmt.Println("Error " + err.Error())
			}

			for client := range h.clients {
				if client.channel == messageTuple.Message.Channel {
					// we have a private message, and it's not for this user
					if messageTuple.Message.PmUsername != "" && messageTuple.Message.PmUsername != client.username && messageTuple.Message.From != client.username {
						continue
					}
					select {
					case client.send <- messageTuple.Message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		}
	}
}
