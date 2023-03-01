// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package app

import (
	"encoding/json"
	"fmt"
)

type Message struct {
	Content   string `json:"content"`
	From      string `json:"from"`
	Timestamp string `json:"timestamp"`
	Channel   string `json:"channel"`
	Type      int    `json:"type"`
	Token     string `json:"token"`
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) run() {
	for {
		fmt.Println("Top of hub run loop...")
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
		case message := <-h.broadcast:
			var typed_message Message
			json.Unmarshal(message, &typed_message)
			fmt.Printf("Broadcast message %s from %s on channel %s\n", typed_message.Content, typed_message.From, typed_message.Channel)
			fmt.Printf("Token sent is: %s\n", typed_message.Token)
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
