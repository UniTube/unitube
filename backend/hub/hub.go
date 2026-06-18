package hub

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
)

type Client struct {
    ID     string
    UserID string
    Send   chan Event
}

type Event struct {
    Type    string      `json:"type"`   // ex: "new_video"
    Payload interface{} `json:"payload"`
}

type Hub struct {
    clients map[*Client]struct{}
    mu      sync.RWMutex
}

var Instance = &Hub{
    clients: make(map[*Client]struct{}),
}

func (h *Hub) Register(c *Client) {
    h.mu.Lock()
    defer h.mu.Unlock()
    h.clients[c] = struct{}{}
    log.Printf("[SSE] Client connecté: %s (user: %s) — total: %d", c.ID, c.UserID, len(h.clients))
}

func (h *Hub) Unregister(c *Client) {
    h.mu.Lock()
    defer h.mu.Unlock()
    if _, ok := h.clients[c]; ok {
        delete(h.clients, c)
        close(c.Send)
        log.Printf("[SSE] Client déconnecté: %s — total: %d", c.ID, len(h.clients))
    }
}

// Broadcast à tous sauf le clientID émetteur
func (h *Hub) BroadcastExcept(event Event, excludeClientID string) {
    h.mu.RLock()
    defer h.mu.RUnlock()

    for client := range h.clients {
        if client.ID == excludeClientID { // ← compare clientID, pas userID
            continue
        }
        select {
        case client.Send <- event:
        default:
            log.Printf("[SSE] Client %s trop lent, message ignoré", client.ID)
        }
    }
}

// Broadcast à tous les clients
func (h *Hub) Broadcast(event Event) {
    h.BroadcastExcept(event, "")
}

func FormatSSE(event Event) (string, error) {
    data, err := json.Marshal(event)
    if err != nil {
        return "", err
    }
    return fmt.Sprintf("event: %s\ndata: %s\n\n", event.Type, string(data)), nil
}