package version

import (
	"app/utils"
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

type VersionResponse struct {
	Version string `json:"version"`
}

func version(w http.ResponseWriter, r *http.Request) {
	var version VersionResponse
	version.Version = "1.2.2"
	json.NewEncoder(w).Encode(&version)
}

func InitViews(router *mux.Router) {
	router.HandleFunc("/api/version", utils.LogRequest(version)).Methods("GET", "OPTIONS")
}
