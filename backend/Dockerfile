FROM golang:1.25

WORKDIR /backend

COPY . .

RUN go mod init backend
RUN go get github.com/gin-gonic/gin@v1.9.1
RUN go get gorm.io/gorm@v1.25.0
RUN go get gorm.io/driver/postgres@v1.5.0
RUN go get github.com/joho/godotenv@v1.5.1
RUN go get github.com/google/uuid
RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN go get -u github.com/swaggo/swag/cmd/swag
RUN go get -u github.com/swaggo/gin-swagger
RUN go get -u github.com/swaggo/files
RUN go mod tidy
RUN swag init 

EXPOSE 8088

CMD ["go", "run", "main.go"]