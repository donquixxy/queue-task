package payload

type (
	QueueCreate struct {
		Payload string `json:"payload" form:"payload"`
	}

	QueueFilter struct {
		SortedBy string `query:"sorted_by"`
	}

	QueueRetry struct {
		ID string `param:"id"`
	}
)
