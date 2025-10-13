package v_web_middlewares

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	vlogger "voxesis/src/Common/Logger"
	vwebutils "voxesis/src/Web/Utils"

	"github.com/gin-gonic/gin"
)

func AutoCookie() gin.HandlerFunc {
	return func(context *gin.Context) {
		cookie, err := context.Cookie("auth")
		if err != nil {
			vlogger.AppLogger.Error(err.Error())
			context.Redirect(http.StatusMovedPermanently, "/login")
			return
		}

		conf, err := vwebutils.GetAuthConfig()
		if err != nil {
			vlogger.AppLogger.Error(err.Error())
			context.Redirect(http.StatusMovedPermanently, "/login")
			return
		}

		verify := verifyToken(conf.Token, cookie)

		if verify {
			context.Next()
		} else {
			context.Redirect(http.StatusMovedPermanently, "/login")
		}
	}
}

func verifyToken(tokenStr string, storedHashHex string) bool {
	inputHash := sha256.Sum256([]byte(tokenStr))
	inputHashHex := hex.EncodeToString(inputHash[:])

	return inputHashHex == storedHashHex
}
