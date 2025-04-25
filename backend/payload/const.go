package payload

type QueueStatus string

const (
	SuccessStatus     QueueStatus = "success"
	FailedStatus      QueueStatus = "failed"
	UnprocessedStatus QueueStatus = "unprocessed"
	ProcessingStatus  QueueStatus = "processing"
)
