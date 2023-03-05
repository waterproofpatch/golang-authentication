package app

import "time"

func formattedTime() string {
	// est, err := time.LoadLocation("America/New York")
	est := time.FixedZone("EST", -5*60*60)

	currentTime := time.Now().In(est)

	return currentTime.Format("03:04:05 PM (EST)")
}
