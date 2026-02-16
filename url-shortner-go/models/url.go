package models

type Url struct {
	ShortId     string `json:"shortId" bson:"shortId"`
	RedirectUrl string `json:"redirectUrl" bson:"redirectUrl"`
	VisitHistory []Visit `json:"visitHistory" bson:"visitHistory"`
}

type Visit struct {
	Timestamp int64  `json:"timestamp" bson:"timestamp"`
}
