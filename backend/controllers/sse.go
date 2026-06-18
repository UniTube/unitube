package controllers

import (
	"backend/hub"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SSEHandler(c *gin.Context) {
    //get the user ID from the context (set by auth middleware) or query param
	
    
    // Headers SSE obligatoires
    c.Writer.Header().Set("Content-Type", "text/event-stream")
    c.Writer.Header().Set("Cache-Control", "no-cache")
    c.Writer.Header().Set("Connection", "keep-alive")
    c.Writer.Header().Set("X-Accel-Buffering", "no") // désactive le buffer nginx
    c.Writer.Flush()

    // Crée et enregistre le client
    client := &hub.Client{
        ID:     uuid.New().String(),
        Send:   make(chan hub.Event, 16),
    }
    hub.Instance.Register(client)
    defer hub.Instance.Unregister(client)

    // Envoie un event de connexion confirmée
    fmt.Fprintf(c.Writer, "event: connected\ndata: {\"client_id\":%q}\n\n", client.ID)
    c.Writer.Flush()

    clientGone := c.Request.Context().Done()

     for {
        select {
        case <-clientGone:
            return
        case event, ok := <-client.Send:
            if !ok {
                return
            }
            msg, _ := hub.FormatSSE(event)
            fmt.Fprint(c.Writer, msg)
            c.Writer.Flush()
        }
    }
}