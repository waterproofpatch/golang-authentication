package utils

import (
	"log"
	"net/http"
	"time"
)

func LogRequest(inner func(http.ResponseWriter, *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		log.Printf(
			"Start %s - %s %s", r.RemoteAddr, r.Method, r.RequestURI)

		inner(w, r)

		timeTaken := time.Since(start)
		log.Printf(
			"End %s - %s %s - took %d", r.RemoteAddr, r.Method, r.RequestURI, timeTaken)

	}
}
