package payload

import (
	"time"
)

type (
	Queue struct {
		ID      string `json:"id"`
		Payload string `json:"payload"`

		// success, failed, unprocessed
		Status      QueueStatus `json:"status"`
		CreatedAt   time.Time   `json:"created_at"`
		ProcessedAt *time.Time  `json:"processed_at"`
	}
)
