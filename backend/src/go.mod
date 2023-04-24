module app

go 1.18

require (
	github.com/gorilla/handlers v1.5.1
	github.com/gorilla/mux v1.8.0
	github.com/gorilla/websocket v1.5.0
	github.com/solywsh/chatgpt v0.0.14
	github.com/waterproofpatch/go_authentication v0.0.0-alpha.5
	gorm.io/gorm v1.24.2
)

replace github.com/waterproofpatch/go_authentication v0.0.0-alpha.4 => ./go_authentication

require (
	github.com/dgrijalva/jwt-go v3.2.0+incompatible // indirect
	github.com/felixge/httpsnoop v1.0.1 // indirect
	github.com/jackc/chunkreader/v2 v2.0.1 // indirect
	github.com/jackc/pgconn v1.13.0 // indirect
	github.com/jackc/pgio v1.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgproto3/v2 v2.3.1 // indirect
	github.com/jackc/pgservicefile v0.0.0-20200714003250-2b9c44734f2b // indirect
	github.com/jackc/pgtype v1.12.0 // indirect
	github.com/jackc/pgx/v4 v4.17.2 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.4 // indirect
	github.com/sashabaranov/go-gpt3 v1.0.0 // indirect
	github.com/thanhpk/randstr v1.0.4 // indirect
	golang.org/x/crypto v0.2.0 // indirect
	golang.org/x/text v0.4.0 // indirect
	gorm.io/driver/postgres v1.4.5 // indirect
)
