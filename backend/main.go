package main

import (
	"backend/payload"
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"sync"
	"syscall"
	"time"
)

var (
	queueData    []*payload.Queue
	m            sync.Mutex
	finishedTask = make(chan string)
)

// As this is a simple app, we dont need to create complex structure.
// Init everything in main is fine.
func main() {
	e := echo.New()

	e.Use(middleware.CORS())
	sigChan := make(chan os.Signal, 1)
	ctx := context.Background()
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	workerNum := 10

	for i := 0; i < workerNum; i++ {
		go work()
	}

	log.Printf("Successfully deploy %v worker", workerNum)

	// Init route
	initRoute(e)

	// Run server
	go func() {
		if err := e.Start(":7777"); err != nil {
			log.Fatalf("shutting down the server with error: %v", err)
		}
	}()

	// Block goroutine; wait for the incoming signal
	s := <-sigChan
	log.Printf("Receiving signal %v Shuttin down app", s)
	nCtx, cancel := context.WithTimeout(ctx, 20*time.Second)

	defer cancel()

	if err := e.Shutdown(nCtx); err != nil {
		log.Fatalf("shutting down the server with error: %v", err)
	}
}

func getQueue(filter payload.QueueFilter) []*payload.Queue {

	// If value is present as asc; sort by (old-new)
	if filter.SortedBy == "asc" {
		sort.Slice(queueData, func(i, j int) bool {
			return queueData[i].CreatedAt.Before(queueData[j].CreatedAt)
		})
	} else {
		// by default Sort by desc (new-old)
		sort.Slice(queueData, func(i, j int) bool {
			return queueData[i].CreatedAt.After(queueData[j].CreatedAt)
		})
	}

	return queueData
}

func postQueue(data payload.QueueCreate) *payload.Queue {
	now := time.Now()
	m.Lock()
	defer m.Unlock()

	queue := payload.Queue{
		ID:          uuid.NewString(),
		Payload:     data.Payload,
		Status:      payload.UnprocessedStatus,
		CreatedAt:   now,
		ProcessedAt: nil,
	}

	queueData = append(queueData, &queue)
	log.Printf("New queue deployed %+v", fmt.Sprintf("%+v", queue))
	return &queue
}

func execQueue() {
	now := time.Now()
	m.Lock()

	var foundData *payload.Queue

	for _, q := range queueData {
		if q.Status == payload.UnprocessedStatus {
			// Update status to processing;
			q.Status = payload.ProcessingStatus
			q.ProcessedAt = &now
			foundData = q
			break
		}
	}
	m.Unlock()

	if foundData == nil {
		return
	}

	// Assuming the other service or backend took 5 second to process
	time.Sleep(time.Second * 5)

	// Randomly 50:50 to make the data either success or failed
	rNumber := rand.Intn(2)
	m.Lock()

	// If success
	foundData.Status = payload.SuccessStatus

	if rNumber == 0 {
		// If Failed
		foundData.Status = payload.FailedStatus
	}
	foundData.ProcessedAt = &now
	m.Unlock()
	msg := fmt.Sprintf("Successfully process queue %v with status %v", foundData.ID, foundData.Status)

	log.Println(msg)
	finishedTask <- msg
}

func retryQueue(filter payload.QueueRetry) error {
	now := time.Now()
	m.Lock()
	defer m.Unlock()
	var foundData *payload.Queue

	// Get data by id
	for _, q := range queueData {
		if q.ID == filter.ID {
			foundData = q
			break
		}
	}

	if foundData == nil {
		return fmt.Errorf("queue with id %v not found", filter.ID)
	}

	if foundData.Status != payload.FailedStatus {
		return fmt.Errorf("failed to retry, only %v status can be retried", payload.FailedStatus)
	}

	foundData.Status = payload.UnprocessedStatus
	foundData.ProcessedAt = &now

	log.Printf("[Retry] - Successfully retry queue %v", foundData.ID)

	return nil
}

func work() {
	for {
		execQueue()
	}
}

func initRoute(e *echo.Echo) {
	e.POST("/queue", func(c echo.Context) error {
		pyld := payload.QueueCreate{}

		if err := c.Bind(&pyld); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		if len(pyld.Payload) <= 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "payload is required")
		}

		result := postQueue(pyld)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"data": result,
			"msg":  "successfully created",
		})
	})

	e.GET("/queue", func(c echo.Context) error {
		pyld := payload.QueueFilter{}

		if err := c.Bind(&pyld); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		result := getQueue(pyld)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"data": result,
			"msg":  "successfully retrieved",
		})
	})

	e.PUT("/queue/:id/retry", func(c echo.Context) error {
		pyld := payload.QueueRetry{}

		if err := c.Bind(&pyld); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		if len(pyld.ID) <= 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "id is required")
		}

		err := retryQueue(pyld)

		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"msg": "successfully retry queue",
		})
	})

	e.GET("/queue/events", func(c echo.Context) error {
		log.Printf("SSE client connected, ip : %v", c.RealIP())

		w := c.Response()
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		for {
			select {
			case <-c.Request().Context().Done():
				log.Printf("Client is disconnected %v", c.RealIP())
				return nil
			case msg := <-finishedTask:
				eventData := fmt.Sprintf("data: %s\n\n", msg)
				_, err := w.Write([]byte(eventData))

				if err != nil {
					log.Printf("err on writer %v", err)
					return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
				}

				log.Println("Sending Event task finished")
				w.Flush()
			}
		}
	})
}
