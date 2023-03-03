// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package app

import (
	"encoding/json"
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
	Message []byte
	Client  *Client
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
		case client.send <- *message:
		default:
			close(client.send)
			delete(h.clients, client)
		}
	}
}
func broadcastClientLeave(h *Hub, username string) {

	var message Message
	message.Type = 3 // SERVER
	message.Content = fmt.Sprintf("Client [%s] left.", username)
	message.Timestamp = FormattedTime()
	message.From = "Server"
	message.Channel = "Broadcast"
	broadcast(h, &message)
}
func broadcastClientJoin(h *Hub, username string) {

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
			broadcastClientJoin(h, client.username)
			h.clients[client] = true
		case client := <-h.unregister:
			fmt.Print("Unregistering client: ", client.conn.RemoteAddr().String())
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			broadcastClientLeave(h, client.username)
		case messageTuple := <-h.broadcast:
			var typed_message Message
			json.Unmarshal(messageTuple.Message, &typed_message)
			// fmt.Printf("Token sent is: %s\n", typed_message.Token)

			typed_message.From = messageTuple.Client.username
			typed_message.Timestamp = FormattedTime()
			typed_message.Token = "" // dont send tokens to other clients
			typed_message.Type = 1   // User

			fmt.Printf("Broadcast message %s from %s on channel %s\n", typed_message.Content, messageTuple.Client.username, typed_message.Channel)

			err := AddMessage(authentication.GetDb(), typed_message)
			if err != nil {
				fmt.Println("Error " + err.Error())
			}

			for client := range h.clients {
				if client.channel == typed_message.Channel {

					select {
					case client.send <- typed_message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		}
	}
}
