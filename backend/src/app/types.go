package app

// Declare a new custom type
type ResponseCode int

// Declare related constants for Weekday
const (
	Generic ResponseCode = iota
)

type HttpResponse struct {
	Message string       `json:"message"`
	Code    ResponseCode `json:"code"`
}
