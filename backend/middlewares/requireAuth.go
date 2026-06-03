package middlewares

import (
	"fmt"
	"os"
	"time"

	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(ctx *gin.Context) {
	authHeader := ctx.Cookie("Authorization")
	if authHeader == "" {
		ctx.JSON(401, gin.H{"error": "Authorization header is required"})
		ctx.Abort()
		return
	}
	if err := verifyToken(authHeader); err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	ctx.Next()
}

func verifyToken(tokenString string) error {
   token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
      return []byte(os.Getenv("JWT_SECRET")), nil
   })
  
   if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
	  
	  if exp, ok := claims["exp"].(float64); ok {
		 if int64(exp) < time.Now().Unix() {
			return fmt.Errorf("token has expired")
		 }
	}
   }

   if err != nil {
      return err
   }
  
   if !token.Valid {
      return fmt.Errorf("invalid token")
   }
  
   return nil
}