package middlewares

import (
	"fmt"
	"os"
	"strings"
	"time"

	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(ctx *gin.Context) {
	token, _ := ctx.Cookie("Authorization")
	if token == "" {
		authHeader := ctx.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}
	if token == "" {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization is required"})
		return
	}
	if err := verifyToken(token); err != nil {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if email, err := emailFromToken(token); err == nil {
		ctx.Set("authEmail", email)
	}
	ctx.Next()
}

func GetAuthenticatedEmail(ctx *gin.Context) (string, error) {
	if email, ok := ctx.Get("authEmail"); ok {
		if emailStr, ok := email.(string); ok && emailStr != "" {
			return emailStr, nil
		}
	}

	token, _ := ctx.Cookie("Authorization")
	if token == "" {
		authHeader := ctx.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}
	if token == "" {
		return "", fmt.Errorf("authorization is required")
	}
	return emailFromToken(token)
}

func emailFromToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})
	if err != nil {
		return "", err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}
	email, ok := claims["username"].(string)
	if !ok || email == "" {
		return "", fmt.Errorf("invalid token claims")
	}
	return email, nil
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

