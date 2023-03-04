// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package app

import (
	"fmt"

	"github.com/waterproofpatch/go_authentication/authentication"
)

type Message struct {
	Content   string `json:"content"`
	From      string `json:"from"`
	Timestamp string `json:"timestamp"`
	Channel   string `json:"channel"`
	Type      int    `json:"type"`
	Token     string `json:"token"`
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

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan *MessageClientTuple),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func broadcast(h *Hub, message *Message) {
	for client := range h.clients {
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
	message.Type = 3 // SERVER
	message.Content = fmt.Sprintf("Client [%s] left.", username)
	message.Timestamp = FormattedTime()
	message.From = "Server"
	message.Channel = "Broadcast"
	broadcast(h, &message)
}

func (h *Hub) broadcastClientJoin(username string) {
	var message Message
	message.Type = 3 // SERVER
	message.Content = fmt.Sprintf("Client [%s] joined.", username)
	message.Timestamp = FormattedTime()
	message.From = "Server"
	message.Channel = "Broadcast"
	broadcast(h, &message)
}

func (h *Hub) run() {
	for {
		fmt.Println("Top of hub run loop...")
		select {
		case client := <-h.register:
			fmt.Println("Registering client: ", client.conn.RemoteAddr().String())
			h.broadcastClientJoin(client.username)
			h.clients[client] = true
		case client := <-h.unregister:
			fmt.Print("Unregistering client: ", client.conn.RemoteAddr().String())
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.broadcastClientLeave(client.username)
		case messageTuple := <-h.broadcast:
			// fmt.Printf("Token sent is: %s\n", message.Token)

			messageTuple.Message.From = messageTuple.Client.username
			messageTuple.Message.Timestamp = FormattedTime()
			messageTuple.Message.Token = "" // dont send tokens to other clients
			messageTuple.Message.Type = 1   // User

			fmt.Printf("Broadcast message %s from %s on channel %s\n", messageTuple.Message.Content, messageTuple.Client.username, messageTuple.Message.Channel)

			err := AddMessage(authentication.GetDb(), messageTuple.Message)
			if err != nil {
				fmt.Println("Error " + err.Error())
			}

			for client := range h.clients {
				if client.channel == messageTuple.Message.Channel {
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
